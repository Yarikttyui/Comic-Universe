import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { User, RefreshToken, PasswordResetToken } from '../models/index.js';
import { errors } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { issueSession, refreshSession, toSafeUser } from '../services/authService.js';
import { config } from '../config/index.js';
import {
  sendVerificationCode,
  sendPasswordResetLink,
} from '../services/emailService.js';

const router = Router();
const NICK_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Неверный email'),
  body('nick')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(NICK_PATTERN)
    .withMessage('Ник: 3-30 символов, буквы, цифры, подчёркивание'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Пароль должен быть не менее 8 символов'),
  body('confirmPassword')
    .isLength({ min: 8 })
    .withMessage('Подтверждение пароля обязательно')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Пароли не совпадают'),
];

const loginValidation = [body('email').isEmail().normalizeEmail(), body('password').notEmpty()];

const onboardingRoleValidation = [
  body('role').isIn(['reader']).withMessage('При регистрации можно выбрать только роль читателя'),
];

function assertValidation(req: Request) {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const details: Record<string, string[]> = {};
    validationErrors.array().forEach((error: any) => {
      if (!details[error.path]) details[error.path] = [];
      details[error.path].push(error.msg);
    });
    throw errors.validation('Validation failed', details);
  }
}

router.post('/register', registerValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertValidation(req);

    const { password } = req.body as {
      email: string;
      nick: string;
      password: string;
      confirmPassword: string;
    };

    const email = String(req.body.email).trim().toLowerCase();
    const nick = String(req.body.nick).trim();

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      if (!existingEmail.emailVerified) {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        await existingEmail.update({
          verificationCode: code,
          verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
          password,
          displayName: nick,
        });
        await sendVerificationCode(email, code, nick);
        return res.status(200).json({
          success: true,
          data: { needsVerification: true, email },
        });
      }
      throw errors.conflict('Электронная почта уже зарегистрирована');
    }

    const existingNick = await User.findOne({ where: { displayName: nick } });
    if (existingNick) {
      throw errors.conflict('Ник уже занят');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    await User.create({
      email,
      password,
      displayName: nick,
      role: 'reader',
      onboardingStage: 'done',
      accountStatus: 'active',
      emailVerified: false,
      verificationCode: code,
      verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    await sendVerificationCode(email, code, nick);

    res.status(201).json({
      success: true,
      data: { needsVerification: true, email },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      throw errors.badRequest('Неверные данные для входа');
    }

    const email = String(req.body.email).trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw errors.unauthorized('Неверный email или пароль');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw errors.unauthorized('Неверный email или пароль');
    }

    if (!user.emailVerified) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await user.update({
        verificationCode: code,
        verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
      });
      await sendVerificationCode(user.email, code, user.displayName);
      return res.json({
        success: true,
        data: { needsVerification: true, email: user.email },
      });
    }

    if (user.accountStatus === 'banned') {
      const now = new Date();
      if (!user.bannedUntil || user.bannedUntil > now) {
        const until = user.bannedUntil
          ? user.bannedUntil.toLocaleDateString('ru-RU')
          : 'бессрочно';
        const reason = user.banReason || 'Не указана';
        throw errors.forbidden(`Аккаунт заблокирован до: ${until}. Причина: ${reason}`);
      }
      await user.update({ accountStatus: 'active', bannedUntil: null, banReason: null });
    }

    const payload = await issueSession(user);

    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Код должен содержать 6 цифр'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      assertValidation(req);

      const email = String(req.body.email).trim().toLowerCase();
      const code = String(req.body.code).trim();

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw errors.notFound('Пользователь не найден');
      }

      if (user.emailVerified) {
        throw errors.badRequest('Email уже подтверждён');
      }

      if (!user.verificationCode || !user.verificationCodeExpires) {
        throw errors.badRequest('Код подтверждения не был отправлен');
      }

      if (new Date() > user.verificationCodeExpires) {
        throw errors.badRequest('Код подтверждения истёк. Запросите новый');
      }

      if (user.verificationCode !== code) {
        throw errors.badRequest('Неверный код подтверждения');
      }

      await user.update({
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      });

      const payload = await issueSession(user);

      res.json({
        success: true,
        data: payload,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/resend-code',
  [body('email').isEmail().normalizeEmail()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      assertValidation(req);

      const email = String(req.body.email).trim().toLowerCase();
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw errors.notFound('Пользователь не найден');
      }

      if (user.emailVerified) {
        throw errors.badRequest('Email уже подтверждён');
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      await user.update({
        verificationCode: code,
        verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
      });

      await sendVerificationCode(email, code, user.displayName);

      res.json({
        success: true,
        data: { message: 'Код отправлен повторно' },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      assertValidation(req);

      const email = String(req.body.email).trim().toLowerCase();
      const user = await User.findOne({ where: { email } });

      if (user) {
        await PasswordResetToken.update(
          { used: true },
          { where: { userId: user.id, used: false } },
        );

        const token = crypto.randomBytes(48).toString('hex');
        await PasswordResetToken.create({
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });

        const resetUrl = `${config.appUrl}/reset-password?token=${token}`;
        await sendPasswordResetLink(user.email, resetUrl, user.displayName);
      }

      res.json({
        success: true,
        data: { message: 'Если аккаунт существует, письмо для сброса пароля отправлено' },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Токен обязателен'),
    body('newPassword').isLength({ min: 8 }).withMessage('Пароль должен быть не менее 8 символов'),
    body('confirmPassword')
      .isLength({ min: 8 })
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Пароли не совпадают'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      assertValidation(req);

      const { token, newPassword } = req.body;

      const resetToken = await PasswordResetToken.findOne({
        where: { token, used: false },
      });

      if (!resetToken) {
        throw errors.badRequest('Недействительная или использованная ссылка сброса');
      }

      if (resetToken.isExpired()) {
        throw errors.badRequest('Ссылка для сброса пароля истекла');
      }

      const user = await User.findByPk(resetToken.userId);
      if (!user) {
        throw errors.notFound('Пользователь не найден');
      }

      await user.update({ password: newPassword });
      await resetToken.update({ used: true });

      await RefreshToken.destroy({ where: { userId: user.id } });

      const payload = await issueSession(user);

      res.json({
        success: true,
        data: payload,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/onboarding/role',
  authenticate,
  onboardingRoleValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      assertValidation(req);

      const user = await User.findByPk(req.user!.id);
      if (!user) {
        throw errors.notFound('Пользователь не найден');
      }

      await user.update({ role: 'reader', onboardingStage: 'done' });

      res.json({
        success: true,
        data: { user: toSafeUser(user) },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/onboarding/creator-profile', authenticate, async (_req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    throw errors.badRequest('Онбординг создателя отключён. Отправьте заявку из профиля и дождитесь одобрения админом.');
  } catch (error) {
    next(error);
  }
});

router.post('/onboarding/reader-complete', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      throw errors.notFound('User not found');
    }

    await user.update({ role: 'reader', onboardingStage: 'done' });

    res.json({
      success: true,
      data: { user: toSafeUser(user) },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw errors.badRequest('Требуется токен обновления');
    }

    const tokens = await refreshSession(refreshToken);

    if (!tokens) {
      throw errors.unauthorized('Недействительный токен обновления');
    }

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id);

    if (!user) {
      throw errors.notFound('Пользователь не найден');
    }

    res.json({
      success: true,
      data: { user: toSafeUser(user) },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.destroy({ where: { token: refreshToken } });
    }

    res.json({
      success: true,
      data: { message: 'Выход выполнен' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
