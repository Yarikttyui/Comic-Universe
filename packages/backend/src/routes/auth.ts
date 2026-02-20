import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User, RefreshToken } from '../models/index.js';
import { errors } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const NICK_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

function normalizeRole(role: string): 'reader' | 'creator' | 'admin' {
  if (role === 'author') return 'creator';
  if (role === 'admin') return 'admin';
  if (role === 'creator') return 'creator';
  return 'reader';
}

function toSafeUser(user: User) {
  const safe = user.toSafeJSON() as any;
  safe.role = normalizeRole(safe.role);

  safe.onboardingStage = 'done';
  safe.isOnboardingCompleted = true;
  safe.nextAction = null;
  return safe;
}

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

function generateTokens(user: User) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: normalizeRole(user.role),
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
}

async function issueSession(user: User) {
  const tokens = generateTokens(user);

  await RefreshToken.create({
    userId: user.id,
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    user: toSafeUser(user),
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
    },
  };
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
      throw errors.conflict('Электронная почта уже зарегистрирована');
    }

    const existingNick = await User.findOne({ where: { displayName: nick } });
    if (existingNick) {
      throw errors.conflict('Ник уже занят');
    }

    const user = await User.create({
      email,
      password,
      displayName: nick,
      role: 'reader',
      onboardingStage: 'done',
      accountStatus: 'active',
    });

    const payload = await issueSession(user);

    res.status(201).json({
      success: true,
      data: payload,
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

    const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });

    if (!storedToken || storedToken.isExpired()) {
      if (storedToken) await storedToken.destroy();
      throw errors.unauthorized('Недействительный токен обновления');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as {
        userId: string;
      };

      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw errors.unauthorized('Пользователь не найден');
      }

      await storedToken.destroy();

      const tokens = generateTokens(user);
      await RefreshToken.create({
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 900,
          },
        },
      });
    } catch {
      throw errors.unauthorized('Недействительный токен обновления');
    }
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
