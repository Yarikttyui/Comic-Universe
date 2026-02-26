import { Router } from 'express';
import { Op } from 'sequelize';
import {
  Comic,
  ComicPage,
  ComicRating,
  ComicComment,
  CommentReport,
  ComicReport,
  User,
} from '../models/index.js';
import { authenticate, optionalAuth, authorize, AuthRequest } from '../middleware/auth.js';
import { errors } from '../middleware/errorHandler.js';
import { normalizeRole } from '../utils/roleUtils.js';
import { notifyNewComment } from '../services/notificationService.js';
import { cacheGet, cacheSet } from '../services/redisService.js';

const router = Router();

function canAccessUnpublished(req: AuthRequest, comic: Comic): boolean {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  return comic.authorId === req.user.id;
}

async function withAuthorCreatorNick(comic: Comic) {
  const raw = comic.get({ plain: true }) as any;
  if (!comic.authorId) {
    return { ...raw, authorCreatorNick: null };
  }

  const author = await User.findByPk(comic.authorId, {
    attributes: ['creatorNick'],
  });

  return {
    ...raw,
    authorCreatorNick: author?.creatorNick || null,
  };
}

router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      genres,
      size,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const where: any = { status: 'published', hiddenByAdmin: false };

    if (size) {
      where.size = size;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const ALLOWED_SORT_COLUMNS = ['createdAt', 'rating', 'readCount', 'title'];
    const safeSortBy = ALLOWED_SORT_COLUMNS.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const order: any[] = [[safeSortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']];
    const comics = await Comic.findAll({
      where,
      order,
      attributes: [
        'id',
        'title',
        'description',
        'coverImage',
        'authorName',
        'genres',
        'size',
        'rating',
        'ratingCount',
        'readCount',
        'estimatedMinutes',
        'totalPages',
        'totalEndings',
        'createdAt',
      ],
    });

    let filtered = comics;
    if (genres) {
      const genreList = String(genres)
        .split(',')
        .map((g) => g.trim().toLowerCase())
        .filter(Boolean);
      filtered = filtered.filter((comic) =>
        (comic.genres || []).some((g) => genreList.includes(String(g).toLowerCase()))
      );
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;
    const paged = filtered.slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: { comics: paged },
      meta: {
        page: pageNum,
        limit: limitNum,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/featured', async (_req, res, next) => {
  try {
    const cached = await cacheGet<any>('comics:featured');
    if (cached) {
      return res.json({ success: true, data: { comics: cached } });
    }

    const comics = await Comic.findAll({
      where: { status: 'published', hiddenByAdmin: false },
      order: [['readCount', 'DESC'], ['rating', 'DESC']],
      limit: 3,
      attributes: [
        'id',
        'title',
        'description',
        'coverImage',
        'authorName',
        'genres',
        'size',
        'rating',
        'ratingCount',
        'readCount',
        'estimatedMinutes',
        'totalPages',
        'totalEndings',
      ],
    });

    await cacheSet('comics:featured', comics, 120);

    res.json({
      success: true,
      data: { comics },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const cached = await cacheGet<any>('comics:stats');
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const comics = await Comic.findAll({
      where: { status: 'published', hiddenByAdmin: false },
      attributes: ['id', 'totalPages', 'totalEndings'],
    });

    const totalComics = comics.length;
    const totalPages = comics.reduce((sum, comic) => sum + (comic.totalPages || 0), 0);
    const totalEndings = comics.reduce((sum, comic) => sum + (comic.totalEndings || 0), 0);

    const totalReaders = await User.count();

    const pages = await ComicPage.findAll({
      where: { comicId: comics.map((comic) => comic.id) },
      attributes: ['choices'],
    });
    const totalPaths = pages.reduce((sum, page) => sum + (page.choices?.length || 0), 0);

    const statsData = {
      totalComics,
      totalPages,
      totalEndings,
      totalReaders,
      totalPaths,
    };

    await cacheSet('comics:stats', statsData, 300);

    res.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/comments', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const comic = await Comic.findByPk(req.params.id);
    if (!comic) {
      throw errors.notFound('Комикс не найден');
    }
    if (comic.status !== 'published' && !canAccessUnpublished(req, comic)) {
      throw errors.notFound('Комикс не найден');
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const offset = (page - 1) * limit;

    const { count, rows } = await ComicComment.findAndCountAll({
      where: {
        comicId: comic.id,
        status: 'visible',
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'displayName', 'avatar', 'role', 'creatorNick'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const comments = rows.map((comment: any) => ({
      ...comment.get({ plain: true }),
      user: comment.user
        ? {
            ...comment.user.get({ plain: true }),
            role: normalizeRole(comment.user.role),
          }
        : null,
    }));

    res.json({
      success: true,
      data: { comments },
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/comments', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const comic = await Comic.findByPk(req.params.id);
    if (!comic || comic.status !== 'published') {
      throw errors.notFound('Комикс не найден');
    }

    const body = String(req.body?.body || '').trim();
    if (!body) {
      throw errors.badRequest('Текст комментария обязателен');
    }

    const comment = await ComicComment.create({
      comicId: comic.id,
      userId: req.user!.id,
      body,
      status: 'visible',
    });

    const commentWithUser = await ComicComment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'displayName', 'avatar', 'role', 'creatorNick'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: {
        comment: commentWithUser
          ? {
              ...commentWithUser.get({ plain: true }),
              user: commentWithUser.get('user')
                ? {
                    ...(commentWithUser.get('user') as any).get({ plain: true }),
                    role: normalizeRole((commentWithUser.get('user') as any).role),
                  }
                : null,
            }
          : null,
      },
    });

    if (comic.authorId && comic.authorId !== req.user!.id) {
      const commenterUser = await User.findByPk(req.user!.id, { attributes: ['displayName', 'creatorNick'] });
      const commenterName = commenterUser?.displayName || commenterUser?.creatorNick || 'Пользователь';
      notifyNewComment(comic.authorId, comic.id, comic.title, commenterName).catch(() => {});
    }
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/comments/:commentId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const comment = await ComicComment.findOne({
      where: { id: req.params.commentId, comicId: req.params.id },
    });

    if (!comment) {
      throw errors.notFound('Комментарий не найден');
    }

    const isOwner = comment.userId === req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw errors.forbidden('У вас нет прав на удаление этого комментария');
    }

    await comment.update({
      status: 'deleted',
      deletedAt: new Date(),
    });

    res.json({
      success: true,
      data: { message: 'Комментарий удалён' },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/comments/:commentId/report', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const comment = await ComicComment.findOne({
      where: { id: req.params.commentId, comicId: req.params.id },
    });

    if (!comment || comment.status !== 'visible') {
      throw errors.notFound('Комментарий не найден');
    }

    const reason = String(req.body?.reason || '').trim();
    if (!reason) {
      throw errors.badRequest('Укажите причину жалобы');
    }

    const existing = await CommentReport.findOne({
      where: {
        commentId: comment.id,
        reporterId: req.user!.id,
      },
    });

    if (existing) {
      throw errors.conflict('Вы уже пожаловались на этот комментарий');
    }

    const report = await CommentReport.create({
      commentId: comment.id,
      reporterId: req.user!.id,
      reason,
      status: 'open',
    });

    res.status(201).json({
      success: true,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const comicId = req.params.id;
    const cacheKey = `comics:detail:${comicId}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached && cached.status === 'published' && !cached.hiddenByAdmin) {
      return res.json({ success: true, data: { comic: cached } });
    }

    const comic = await Comic.findByPk(comicId);

    if (!comic) {
      throw errors.notFound('Комикс не найден');
    }

    if (comic.hiddenByAdmin && req.user?.role !== 'admin') {
      throw errors.notFound('Комикс не найден');
    }

    if (comic.status !== 'published' && !canAccessUnpublished(req, comic)) {
      throw errors.notFound('Комикс не найден');
    }

    const comicData = await withAuthorCreatorNick(comic);

    if (comic.status === 'published' && !comic.hiddenByAdmin) {
      await cacheSet(cacheKey, comicData, 180);
    }

    res.json({
      success: true,
      data: { comic: comicData },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/pages', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const comic = await Comic.findByPk(req.params.id);

    if (!comic) {
      throw errors.notFound('Комикс не найден');
    }

    if (comic.status !== 'published' && !canAccessUnpublished(req, comic)) {
      throw errors.notFound('Комикс не найден');
    }

    const pages = await ComicPage.findAll({
      where: { comicId: comic.id },
      order: [['pageNumber', 'ASC']],
    });

    await comic.increment('readCount');
    const comicData = await withAuthorCreatorNick(comic);

    res.json({
      success: true,
      data: { comic: comicData, pages },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/page/:pageId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const page = await ComicPage.findOne({
      where: {
        comicId: req.params.id,
        pageId: req.params.pageId,
      },
    });

    if (!page) {
      throw errors.notFound('Страница не найдена');
    }

    res.json({
      success: true,
      data: { page },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('creator', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const { title, description, coverImage, genres, tags, size } = req.body;
    const author = await User.findByPk(req.user!.id);

    const comic = await Comic.create({
      title,
      description,
      coverImage,
      genres: genres || [],
      tags: tags || [],
      size: size || 'small',
      authorId: req.user!.id,
      authorName: author?.creatorNick || author?.displayName || author?.email || 'creator',
      startPageId: 'page-1',
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      data: { comic },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const comic = await Comic.findByPk(req.params.id);

    if (!comic) {
      throw errors.notFound('Комикс не найден');
    }

    if (comic.authorId !== req.user!.id && req.user!.role !== 'admin') {
      throw errors.forbidden('Нет прав на редактирование этого комикса');
    }

    const updates = { ...req.body };
    delete updates.authorId;
    delete updates.readCount;
    delete updates.rating;
    delete updates.ratingCount;
    delete updates.publishedRevisionId;

    await comic.update(updates);

    res.json({
      success: true,
      data: { comic },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/rate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { rating } = req.body;
    const value = Number(rating);
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      throw errors.badRequest('Оценка должна быть от 1 до 5');
    }

    const comic = await Comic.findByPk(req.params.id);
    if (!comic || comic.status !== 'published') {
      throw errors.notFound('Комикс не найден');
    }

    const existing = await ComicRating.findOne({
      where: { comicId: comic.id, userId: req.user!.id },
    });

    if (existing) {
      await existing.update({ rating: value });
    } else {
      await ComicRating.create({
        comicId: comic.id,
        userId: req.user!.id,
        rating: value,
      });
    }

    const ratings = await ComicRating.findAll({
      where: { comicId: comic.id },
      attributes: ['rating'],
    });
    const ratingCount = ratings.length;
    const ratingAvg =
      ratingCount > 0
        ? ratings.reduce((sum, item) => sum + Number(item.rating), 0) / ratingCount
        : 0;

    await comic.update({
      rating: Math.round(ratingAvg * 10) / 10,
      ratingCount,
    });

    res.json({
      success: true,
      data: {
        rating: Number(comic.rating),
        ratingCount: comic.ratingCount,
        userRating: value,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/report', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (!reason || reason.length < 3) {
      throw errors.badRequest('Причина должна быть не менее 3 символов');
    }

    const comic = await Comic.findByPk(req.params.id);
    if (!comic || comic.status !== 'published') {
      throw errors.notFound('Комикс не найден');
    }

    const existing = await ComicReport.findOne({
      where: { comicId: comic.id, reporterId: req.user!.id, status: 'open' },
    });
    if (existing) {
      throw errors.badRequest('Вы уже пожаловались на этот комикс');
    }

    await ComicReport.create({
      comicId: comic.id,
      reporterId: req.user!.id,
      reason,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
