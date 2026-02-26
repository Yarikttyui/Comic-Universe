import { Router } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Comic,
  ComicComment,
  ComicPage,
  ComicRating,
  ComicReport,
  ComicRevision,
  CommentReport,
  CreatorRoleRequest,
  RefreshToken,
  User,
} from '../models/index.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { errors } from '../middleware/errorHandler.js';
import { normalizePayload } from '../utils/draftConverter.js';
import { notifyComicApproved, notifyComicRejected, notifyCreatorRequestResult, notifySubscribersNewComic, notifyReportResolved } from '../services/notificationService.js';
import { cacheInvalidateComic } from '../services/redisService.js';
import { sendBanEmail, sendUnbanEmail } from '../services/emailService.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/creator-requests', async (req, res, next) => {
  try {
    const requestedStatus = String(req.query.status || 'pending');
    const where =
      requestedStatus === 'all'
        ? {}
        : { status: requestedStatus };

    const requests = await CreatorRoleRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'displayName', 'email', 'role', 'creatorNick'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'displayName', 'creatorNick', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/creator-requests/:requestId/approve', async (req: AuthRequest, res, next) => {
  try {
    const request = await CreatorRoleRequest.findByPk(req.params.requestId);
    if (!request) {
      throw errors.notFound('Заявка не найдена');
    }

    if (request.status !== 'pending') {
      throw errors.badRequest('Можно одобрить только заявки со статусом «на рассмотрении»');
    }

    const targetUser = await User.findByPk(request.userId);
    if (!targetUser) {
      throw errors.notFound('Пользователь не найден');
    }

    if (targetUser.role === 'admin') {
      throw errors.badRequest('Аккаунт админа нельзя преобразовать в создателя через заявку');
    }

    if (targetUser.role === 'creator') {
      throw errors.badRequest('Пользователь уже является создателем');
    }

    const existingCreatorNick = await User.findOne({ where: { creatorNick: request.desiredNick } });
    if (existingCreatorNick && existingCreatorNick.id !== targetUser.id) {
      throw errors.conflict('Ник создателя уже занят');
    }

    const conflictingPendingRequest = await CreatorRoleRequest.findOne({
      where: {
        desiredNick: request.desiredNick,
        status: 'pending',
        id: { [Op.ne]: request.id },
      },
    });
    if (conflictingPendingRequest) {
      throw errors.conflict('Ник создателя зарезервирован другой заявкой');
    }

    await sequelize.transaction(async (transaction) => {
      await targetUser.update(
        {
          role: 'creator',
          creatorNick: request.desiredNick,
          onboardingStage: 'done',
        },
        { transaction }
      );

      await request.update(
        {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: req.user!.id,
          adminComment: req.body?.comment ? String(req.body.comment).trim() : null,
        },
        { transaction }
      );

      await CreatorRoleRequest.update(
        {
          status: 'cancelled',
          reviewedAt: new Date(),
          reviewedBy: req.user!.id,
          adminComment: 'Закрыто после одобрения другой заявки.',
        },
        {
          where: {
            userId: targetUser.id,
            status: 'pending',
            id: { [Op.ne]: request.id },
          },
          transaction,
        }
      );
    });

    res.json({
      success: true,
      data: { requestId: request.id, status: 'approved', userId: targetUser.id },
    });

    notifyCreatorRequestResult(targetUser.id, true).catch(() => {});
  } catch (error) {
    next(error);
  }
});

router.post('/creator-requests/:requestId/reject', async (req: AuthRequest, res, next) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (!reason) {
      throw errors.badRequest('Укажите причину отклонения');
    }

    const request = await CreatorRoleRequest.findByPk(req.params.requestId);
    if (!request) {
      throw errors.notFound('Заявка не найдена');
    }

    if (request.status !== 'pending') {
      throw errors.badRequest('Можно отклонить только заявки со статусом «на рассмотрении»');
    }

    await request.update({
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: req.user!.id,
      adminComment: reason,
    });

    res.json({
      success: true,
      data: { requestId: request.id, status: 'rejected' },
    });

    notifyCreatorRequestResult(request.userId, false, reason).catch(() => {});
  } catch (error) {
    next(error);
  }
});

router.get('/revisions', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'pending_review';
    const revisions = await ComicRevision.findAll({
      where: { status },
      include: [
        {
          model: Comic,
          as: 'comic',
          attributes: ['id', 'title', 'authorId', 'authorName', 'status', 'publishedRevisionId'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'displayName', 'creatorNick', 'email'],
        },
      ],
      order: [['submittedAt', 'ASC']],
    });

    res.json({
      success: true,
      data: { revisions },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/revisions/:revisionId', async (req, res, next) => {
  try {
    const revision = await ComicRevision.findByPk(req.params.revisionId, {
      include: [
        {
          model: Comic,
          as: 'comic',
          attributes: ['id', 'title', 'authorId', 'authorName', 'status', 'publishedRevisionId'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'displayName', 'creatorNick', 'email'],
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'displayName', 'email'],
        },
      ],
    });

    if (!revision) {
      throw errors.notFound('Ревизия не найдена');
    }

    res.json({
      success: true,
      data: { revision },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/revisions/:revisionId/approve', async (req: AuthRequest, res, next) => {
  try {
    const revision = await ComicRevision.findByPk(req.params.revisionId);
    if (!revision) {
      throw errors.notFound('Ревизия не найдена');
    }

    if (revision.status !== 'pending_review') {
      throw errors.badRequest('Можно одобрить только ревизии со статусом «на проверке»');
    }

    const comic = await Comic.findByPk(revision.comicId);
    if (!comic) {
      throw errors.notFound('Комикс не найден');
    }

    const normalized = normalizePayload(revision.payloadJson);
    if (!normalized.comicMeta || !Array.isArray(normalized.nodes)) {
      throw errors.badRequest('Неверные данные ревизии');
    }

    const totalEndings = normalized.nodes.filter((node) => node?.isEnding).length;

    const author = comic.authorId ? await User.findByPk(comic.authorId) : null;

    await sequelize.transaction(async (transaction) => {
      await comic.update(
        {
          title: normalized.comicMeta.title || comic.title,
          description: normalized.comicMeta.description || comic.description,
          coverImage: normalized.comicMeta.coverImage || comic.coverImage,
          genres: normalized.comicMeta.genres || [],
          tags: normalized.comicMeta.tags || [],
          startPageId: normalized.comicMeta.startNodeId || comic.startPageId,
          estimatedMinutes: normalized.comicMeta.estimatedMinutes || comic.estimatedMinutes,
          totalPages: normalized.nodes.length,
          totalEndings,
          status: 'published',
          publishedRevisionId: revision.id,
          authorName: author?.creatorNick || author?.displayName || comic.authorName,
        },
        { transaction }
      );

      await ComicPage.destroy({
        where: { comicId: comic.id },
        transaction,
      });

      if (normalized.nodes.length > 0) {
        await ComicPage.bulkCreate(
          normalized.nodes
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
            .map((node, index) => ({
              comicId: comic.id,
              pageId: node.id || `node-${index + 1}`,
              pageNumber: Number(node.order || index + 1),
              title: node.title || null,
              panels: [
                {
                  id: `${node.id || `node-${index + 1}`}-panel-1`,
                  order: 1,
                  imageUrl: node.imageUrl || '',
                  layout: { x: 0, y: 0, width: 100, height: 100 },
                  dialogues: [],
                },
              ],
              choices: (node.buttons || []).map((button: any, buttonIndex: number) => ({
                id: button.id || `btn-${buttonIndex + 1}`,
                choiceId: button.id || `btn-${buttonIndex + 1}`,
                text: button.text || '',
                targetPageId: button.targetNodeId || '',
                position: { x: Number(button.x || 0), y: Number(button.y || 0), w: Number(button.w || 0), h: Number(button.h || 0) },
                style: 'normal',
              })),
              isEnding: Boolean(node.isEnding),
              endingType: node.isEnding ? 'neutral' : null,
              endingTitle: node.isEnding ? node.title || 'Финал' : null,
            })),
          { transaction }
        );
      }

      await revision.update(
        {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: req.user!.id,
          rejectionReason: null,
        },
        { transaction }
      );
    });

    res.json({
      success: true,
      data: { revisionId: revision.id, comicId: comic.id, status: 'approved' },
    });

    if (comic.authorId) {
      notifyComicApproved(comic.authorId, comic.id, comic.title).catch(() => {});
      const authorUser = await User.findByPk(comic.authorId);
      notifySubscribersNewComic(comic.authorId, comic.id, comic.title, authorUser?.creatorNick || authorUser?.displayName || '').catch(() => {});
    }
    cacheInvalidateComic(comic.id).catch(() => {});
  } catch (error) {
    next(error);
  }
});

router.post('/revisions/:revisionId/reject', async (req: AuthRequest, res, next) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (!reason) {
      throw errors.badRequest('Укажите причину отклонения');
    }

    const revision = await ComicRevision.findByPk(req.params.revisionId);
    if (!revision) {
      throw errors.notFound('Ревизия не найдена');
    }

    if (revision.status !== 'pending_review') {
      throw errors.badRequest('Можно отклонить только ревизии со статусом «на проверке»');
    }

    const comic = await Comic.findByPk(revision.comicId);
    if (!comic) {
      throw errors.notFound('Комикс не найден');
    }

    await revision.update({
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: req.user!.id,
      rejectionReason: reason,
    });

    if (comic.status !== 'published') {
      await comic.update({ status: 'rejected' });
    }

    res.json({
      success: true,
      data: { revisionId: revision.id, status: 'rejected' },
    });

    if (comic.authorId) {
      notifyComicRejected(comic.authorId, comic.id, comic.title, reason).catch(() => {});
    }
  } catch (error) {
    next(error);
  }
});

router.get('/comment-reports', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'open';
    const reports = await CommentReport.findAll({
      where: { status },
      include: [
        {
          model: ComicComment,
          as: 'comment',
          include: [
            { model: Comic, as: 'comic', attributes: ['id', 'title'] },
            { model: User, as: 'user', attributes: ['id', 'displayName', 'creatorNick'] },
          ],
        },
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'displayName', 'creatorNick'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { reports },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/comments/:commentId/hide', async (req: AuthRequest, res, next) => {
  try {
    const comment = await ComicComment.findByPk(req.params.commentId);
    if (!comment) {
      throw errors.notFound('Комментарий не найден');
    }

    await comment.update({ status: 'hidden' });
    await CommentReport.update(
      { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user!.id },
      { where: { commentId: comment.id, status: 'open' } }
    );

    res.json({
      success: true,
      data: { commentId: comment.id, status: 'hidden' },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/comments/:commentId/restore', async (_req: AuthRequest, res, next) => {
  try {
    const comment = await ComicComment.findByPk(_req.params.commentId);
    if (!comment) {
      throw errors.notFound('Комментарий не найден');
    }

    await comment.update({ status: 'visible', deletedAt: null });

    res.json({
      success: true,
      data: { commentId: comment.id, status: 'visible' },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/comments/:commentId', async (req: AuthRequest, res, next) => {
  try {
    const comment = await ComicComment.findByPk(req.params.commentId);
    if (!comment) {
      throw errors.notFound('Комментарий не найден');
    }

    await comment.update({ status: 'deleted', deletedAt: new Date() });
    await CommentReport.update(
      { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user!.id },
      { where: { commentId: comment.id, status: 'open' } }
    );

    res.json({
      success: true,
      data: { commentId: comment.id, status: 'deleted' },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/comics', async (req, res, next) => {
  try {
    const statusFilter = String(req.query.status || 'all');
    const where: any = {};
    if (statusFilter !== 'all') {
      where.status = statusFilter;
    }

    const comics = await Comic.findAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'displayName', 'creatorNick', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'title', 'status', 'hiddenByAdmin', 'authorName',
        'rating', 'ratingCount', 'readCount', 'totalPages', 'createdAt',
      ],
    });

    res.json({ success: true, data: { comics } });
  } catch (error) {
    next(error);
  }
});

router.post('/comics/:comicId/hide', async (req: AuthRequest, res, next) => {
  try {
    const comic = await Comic.findByPk(req.params.comicId);
    if (!comic) throw errors.notFound('Комикс не найден');

    await comic.update({ hiddenByAdmin: true });

    await ComicReport.update(
      { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user!.id },
      { where: { comicId: comic.id, status: 'open' } }
    );

    res.json({ success: true, data: { comicId: comic.id, hidden: true } });
  } catch (error) {
    next(error);
  }
});

router.post('/comics/:comicId/unhide', async (_req: AuthRequest, res, next) => {
  try {
    const comic = await Comic.findByPk(_req.params.comicId);
    if (!comic) throw errors.notFound('Комикс не найден');

    await comic.update({ hiddenByAdmin: false });

    res.json({ success: true, data: { comicId: comic.id, hidden: false } });
  } catch (error) {
    next(error);
  }
});

router.get('/comic-reports', async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'open';
    const reports = await ComicReport.findAll({
      where: { status },
      include: [
        {
          model: Comic,
          as: 'comic',
          attributes: ['id', 'title', 'status', 'hiddenByAdmin'],
        },
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'displayName', 'creatorNick'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: { reports } });
  } catch (error) {
    next(error);
  }
});

router.post('/comic-reports/:reportId/resolve', async (req: AuthRequest, res, next) => {
  try {
    const report = await ComicReport.findByPk(req.params.reportId, {
      include: [{ model: Comic, as: 'comic', attributes: ['id', 'title'] }],
    });
    if (!report) throw errors.notFound('Жалоба не найдена');

    await report.update({
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy: req.user!.id,
    });

    res.json({ success: true, data: { reportId: report.id, status: 'resolved' } });

    const comicTitle = (report as any).comic?.title || 'Комикс';
    notifyReportResolved(report.reporterId, comicTitle).catch(() => {});
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id', 'email', 'displayName', 'creatorNick', 'role',
        'accountStatus', 'bannedUntil', 'banReason', 'createdAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
});

router.post('/users/:userId/ban', async (req: AuthRequest, res, next) => {
  try {
    const { reason, days } = req.body;
    if (!reason || !String(reason).trim()) {
      throw errors.badRequest('Укажите причину блокировки');
    }

    const targetUser = await User.findByPk(req.params.userId);
    if (!targetUser) throw errors.notFound('Пользователь не найден');
    if (targetUser.role === 'admin') throw errors.badRequest('Нельзя заблокировать администратора');

    let bannedUntil: Date | null = null;
    if (days && Number(days) > 0) {
      bannedUntil = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);
    }

    await targetUser.update({
      accountStatus: 'banned',
      bannedUntil,
      banReason: String(reason).trim(),
    });

    await RefreshToken.destroy({ where: { userId: targetUser.id } });

    try {
      const untilStr = bannedUntil ? bannedUntil.toLocaleDateString('ru-RU') : undefined;
      await sendBanEmail(targetUser.email, targetUser.displayName, String(reason).trim(), untilStr);
    } catch (_) {}

    res.json({
      success: true,
      data: {
        userId: targetUser.id,
        status: 'banned',
        bannedUntil,
        banReason: String(reason).trim(),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/users/:userId/unban', async (_req: AuthRequest, res, next) => {
  try {
    const targetUser = await User.findByPk(_req.params.userId);
    if (!targetUser) throw errors.notFound('Пользователь не найден');

    await targetUser.update({
      accountStatus: 'active',
      bannedUntil: null,
      banReason: null,
    });

    try {
      await sendUnbanEmail(targetUser.email, targetUser.displayName);
    } catch (_) {}

    res.json({
      success: true,
      data: { userId: targetUser.id, status: 'active' },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:userId/role', async (req: AuthRequest, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['reader', 'creator'].includes(role)) {
      throw errors.badRequest('Роль должна быть reader или creator');
    }

    const targetUser = await User.findByPk(req.params.userId);
    if (!targetUser) throw errors.notFound('Пользователь не найден');
    if (targetUser.role === 'admin') throw errors.badRequest('Нельзя изменить роль администратора');

    await targetUser.update({ role });

    res.json({
      success: true,
      data: { userId: targetUser.id, role },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:userId', async (req: AuthRequest, res, next) => {
  try {
    const targetUser = await User.findByPk(req.params.userId);
    if (!targetUser) throw errors.notFound('Пользователь не найден');
    if (targetUser.role === 'admin') throw errors.badRequest('Нельзя удалить администратора');

    await sequelize.transaction(async (transaction) => {
      await RefreshToken.destroy({ where: { userId: targetUser.id }, transaction });
      await CreatorRoleRequest.destroy({ where: { userId: targetUser.id }, transaction });
      await CommentReport.destroy({ where: { reporterId: targetUser.id }, transaction });
      await ComicReport.destroy({ where: { reporterId: targetUser.id }, transaction });
      await ComicComment.destroy({ where: { userId: targetUser.id }, transaction });
      await ComicRating.destroy({ where: { userId: targetUser.id }, transaction });

      const userComics = await Comic.findAll({ where: { authorId: targetUser.id }, attributes: ['id'], transaction });
      const comicIds = userComics.map(c => c.id);
      if (comicIds.length > 0) {
        await ComicPage.destroy({ where: { comicId: comicIds }, transaction });
        await ComicRevision.destroy({ where: { comicId: comicIds }, transaction });
        await Comic.destroy({ where: { authorId: targetUser.id }, transaction });
      }

      await targetUser.destroy({ transaction });
    });

    res.json({
      success: true,
      data: { userId: req.params.userId, deleted: true },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
