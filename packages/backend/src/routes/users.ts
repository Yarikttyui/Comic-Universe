import { Router } from 'express';
import {
  CreatorRoleRequest,
  ReadingProgress,
  User,
  UserFavorite,
  Comic,
  UploadedFile,
} from '../models/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { errors } from '../middleware/errorHandler.js';
import { createUploadMiddleware, persistUploadedFile } from '../services/uploadService.js';
import { normalizeRole } from '../utils/roleUtils.js';

const router = Router();
const uploadAvatar = createUploadMiddleware({ fieldName: 'avatar', subDir: 'avatars' });
const USER_NICK_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;
const CREATOR_NICK_PATTERN = /^[a-zA-Z0-9_]{3,50}$/;

router.get('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findByPk(req.user!.id);

    if (!user) {
      throw errors.notFound('Пользователь не найден');
    }

    const favorites = await UserFavorite.findAll({
      where: { userId: user.id },
      include: [
        {
          model: Comic,
          as: 'comic',
          attributes: ['id', 'title', 'coverImage', 'genres'],
        },
      ],
    });

    const userData = user.toSafeJSON();
    (userData as any).role = normalizeRole((userData as any).role);
    (userData as any).favoriteComics = favorites.map((f) => (f as any).comic);

    res.json({
      success: true,
      data: { user: userData },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { displayName, bio, creatorNick, avatarFileId } = req.body;

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      throw errors.notFound('Пользователь не найден');
    }

    const updates: any = {};

    if (displayName !== undefined) {
      const normalizedDisplayName = String(displayName).trim();
      if (!normalizedDisplayName) {
        throw errors.badRequest('Ник не может быть пустым');
      }
      if (!USER_NICK_PATTERN.test(normalizedDisplayName)) {
        throw errors.badRequest('Ник: 3-30 символов, буквы, цифры, подчёркивание');
      }
      if (normalizedDisplayName !== user.displayName) {
        const existingNick = await User.findOne({ where: { displayName: normalizedDisplayName } });
        if (existingNick && existingNick.id !== user.id) {
          throw errors.conflict('Ник уже занят');
        }
      }
      updates.displayName = normalizedDisplayName;
    }

    if (bio !== undefined) {
      const trimmedBio = String(bio).trim();
      if (trimmedBio.length > 500) {
        throw errors.badRequest('Описание не должно превышать 500 символов');
      }
      updates.bio = trimmedBio;
    }

    if (creatorNick !== undefined) {
      const normalizedNick = String(creatorNick).trim();
      if (user.role !== 'creator') {
        throw errors.badRequest('Ник создателя доступен только для создателей');
      }
      if (!CREATOR_NICK_PATTERN.test(normalizedNick)) {
        throw errors.badRequest('Ник создателя: 3-50 символов, буквы, цифры, подчёркивание');
      }
      if (user.creatorNick && normalizedNick !== user.creatorNick) {
        throw errors.forbidden('Ник создателя нельзя изменить');
      }
      if (!user.creatorNick) {
        const existing = await User.findOne({ where: { creatorNick: normalizedNick } });
        if (existing && existing.id !== user.id) {
          throw errors.conflict('Ник создателя уже занят');
        }
        updates.creatorNick = normalizedNick;
      }
    }

    if (avatarFileId !== undefined) {
      const avatarFile = await UploadedFile.findOne({
        where: {
          id: String(avatarFileId),
          ownerUserId: user.id,
        },
      });
      if (!avatarFile) {
        throw errors.badRequest('Неверный файл аватара');
      }
      updates.avatar = avatarFile.publicUrl;
    }

    await user.update(updates);

    res.json({
      success: true,
      data: { user: { ...user.toSafeJSON(), role: normalizeRole(user.role) } },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/creator-request', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const request = await CreatorRoleRequest.findOne({
      where: { userId: req.user!.id },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'displayName', 'creatorNick'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { request },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/creator-request', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      throw errors.notFound('Пользователь не найден');
    }

    if (normalizeRole(user.role) !== 'reader') {
      throw errors.badRequest('Только читатели могут подать заявку на роль создателя');
    }

    const desiredNick = String(req.body?.desiredNick || '').trim();
    const motivationRaw = req.body?.motivation;
    const motivation = motivationRaw === undefined || motivationRaw === null
      ? null
      : String(motivationRaw).trim();

    if (!CREATOR_NICK_PATTERN.test(desiredNick)) {
      throw errors.badRequest('Ник создателя: 3-50 символов, буквы, цифры, подчёркивание');
    }

    if (motivation && motivation.length > 1000) {
      throw errors.badRequest('Комментарий должен быть не длиннее 1000 символов');
    }

    const pendingRequest = await CreatorRoleRequest.findOne({
      where: {
        userId: user.id,
        status: 'pending',
      },
    });
    if (pendingRequest) {
      throw errors.conflict('У вас уже есть заявка на рассмотрении');
    }

    const existingCreatorNick = await User.findOne({ where: { creatorNick: desiredNick } });
    if (existingCreatorNick) {
      throw errors.conflict('Ник создателя уже занят');
    }

    const reservedNick = await CreatorRoleRequest.findOne({
      where: {
        desiredNick,
        status: 'pending',
      },
    });
    if (reservedNick) {
      throw errors.conflict('Ник создателя уже зарезервирован другой заявкой');
    }

    const request = await CreatorRoleRequest.create({
      userId: user.id,
      desiredNick,
      motivation,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/avatar', authenticate, uploadAvatar, async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw errors.badRequest('Файл не загружен');
    }

    const user = await User.findByPk(req.user!.id);
    if (!user) throw errors.notFound('Пользователь не найден');

    const { record, publicUrl } = await persistUploadedFile({
      ownerUserId: user.id,
      file: req.file,
      subDir: 'avatars',
    });

    await user.update({ avatar: publicUrl });

    res.json({
      success: true,
      data: {
        file: {
          id: record.id,
          originalName: record.originalName,
          mimeType: record.mimeType,
          sizeBytes: Number(record.sizeBytes),
          publicUrl,
        },
        avatar: publicUrl,
        user: user.toSafeJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/favorites/:comicId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const comicId = req.params.comicId;

    const comic = await Comic.findByPk(comicId);
    if (!comic) {
      throw errors.notFound('Комикс не найден');
    }

    const existing = await UserFavorite.findOne({
      where: { userId: req.user!.id, comicId },
    });

    if (!existing) {
      await UserFavorite.create({
        userId: req.user!.id,
        comicId,
      });
    }

    res.json({
      success: true,
      data: { message: 'Добавлено в избранное' },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/favorites/:comicId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await UserFavorite.destroy({
      where: {
        userId: req.user!.id,
        comicId: req.params.comicId,
      },
    });

    res.json({
      success: true,
      data: { message: 'Удалено из избранного' },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const progressRecords = await ReadingProgress.findAll({
      where: { userId: req.user!.id },
    });

    let comicsRead = 0;
    let endingsUnlocked = 0;
    let totalChoicesMade = 0;
    let totalTimeSeconds = 0;

    for (const record of progressRecords) {
      const endings = record.unlockedEndings;
      const choices = record.choicesHistory;
      if (endings.length > 0) comicsRead++;
      endingsUnlocked += endings.length;
      totalChoicesMade += choices.length;
      totalTimeSeconds += record.totalTimeSeconds || 0;
    }

    res.json({
      success: true,
      data: {
        stats: {
          comicsRead,
          totalChoicesMade,
          endingsUnlocked,
          readingTimeMinutes: Math.floor(totalTimeSeconds / 60),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/public/:creatorNick', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { creatorNick: req.params.creatorNick },
      attributes: [
        'id',
        'displayName',
        'avatar',
        'creatorNick',
        'bio',
        'role',
        'comicsRead',
        'endingsUnlocked',
        'createdAt',
      ],
    });

    if (!user) {
      throw errors.notFound('Пользователь не найден');
    }

    res.json({
      success: true,
      data: { user: user && { ...user.get({ plain: true }), role: normalizeRole(user.role) } },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
