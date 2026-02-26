import { Router } from 'express';
import { ReadingProgress, Comic, User } from '../models/index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { errors } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const progress = await ReadingProgress.findAll({
      where: { userId: req.user!.id },
      include: [{
        model: Comic,
        as: 'comic',
        attributes: ['id', 'title', 'coverImage', 'totalPages', 'totalEndings']
      }],
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:comicId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    let progress = await ReadingProgress.findOne({
      where: {
        userId: req.user!.id,
        comicId: req.params.comicId,
      }
    });

    if (!progress) {

      const comic = await Comic.findByPk(req.params.comicId);
      if (!comic) {
        throw errors.notFound('Комикс не найден');
      }

      return res.json({
        success: true,
        data: {
          progress: null,
          startPageId: comic.startPageId,
        },
      });
    }

    res.json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:comicId/start', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const comic = await Comic.findByPk(req.params.comicId);
    if (!comic) {
      throw errors.notFound('Комикс не найден');
    }

    let progress = await ReadingProgress.findOne({
      where: {
        userId: req.user!.id,
        comicId: req.params.comicId,
      }
    });

    if (progress) {

      return res.json({
        success: true,
        data: { progress, isNew: false },
      });
    }

    progress = await ReadingProgress.create({
      userId: req.user!.id,
      comicId: req.params.comicId,
      currentPageId: comic.startPageId,
      visitedPages: [comic.startPageId],
      choicesHistory: [],
      variables: {},
      inventory: [],
      unlockedEndings: [],
      startedAt: new Date(),
      totalTimeSeconds: 0,
    });

    res.status(201).json({
      success: true,
      data: { progress, isNew: true },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:comicId/choice', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { pageId, choiceId, targetPageId, timeSpentSeconds } = req.body;

    let progress = await ReadingProgress.findOne({
      where: {
        userId: req.user!.id,
        comicId: req.params.comicId,
      }
    });

    if (!progress) {
      throw errors.notFound('Прогресс чтения не найден. Начните чтение.');
    }

    const visitedPages = [...progress.visitedPages];
    if (!visitedPages.includes(targetPageId)) {
      visitedPages.push(targetPageId);
    }

    const choicesHistory = [...progress.choicesHistory, {
      pageId,
      choiceId,
      timestamp: new Date(),
    }];

    await progress.update({
      currentPageId: targetPageId,
      visitedPages,
      choicesHistory,
      totalTimeSeconds: progress.totalTimeSeconds + (timeSpentSeconds || 0)
    });

    await User.increment('totalChoicesMade', { where: { id: req.user!.id } });

    res.json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:comicId/ending', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { endingPageId } = req.body;

    let progress = await ReadingProgress.findOne({
      where: {
        userId: req.user!.id,
        comicId: req.params.comicId,
      }
    });

    if (!progress) {
      throw errors.notFound('Прогресс чтения не найден');
    }

    const isNewEnding = !progress.unlockedEndings.includes(endingPageId);

    if (isNewEnding) {
      const unlockedEndings = [...progress.unlockedEndings, endingPageId];
      await progress.update({ unlockedEndings });

      const increments: any = { endingsUnlocked: 1 };
      if (unlockedEndings.length === 1) {
        increments.comicsRead = 1;
      }

      const user = await User.findByPk(req.user!.id);
      if (user) {
        await user.update({
          endingsUnlocked: user.endingsUnlocked + 1,
          comicsRead: user.comicsRead + (unlockedEndings.length === 1 ? 1 : 0)
        });
      }
    }

    const comic = await Comic.findByPk(req.params.comicId);
    const allEndingsUnlocked = comic && progress.unlockedEndings.length >= comic.totalEndings;

    res.json({
      success: true,
      data: {
        isNewEnding,
        totalUnlocked: progress.unlockedEndings.length,
        totalEndings: comic?.totalEndings || 0,
        allEndingsUnlocked,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:comicId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const deleted = await ReadingProgress.destroy({
      where: {
        userId: req.user!.id,
        comicId: req.params.comicId,
      }
    });

    if (!deleted) {
      throw errors.notFound('Прогресс не найден');
    }

    res.json({
      success: true,
      data: { message: 'Прогресс сброшен' },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:comicId/sync', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { currentPageId, visitedPages, choicesHistory, variables, inventory, totalTimeSeconds } = req.body;

    let progress = await ReadingProgress.findOne({
      where: {
        userId: req.user!.id,
        comicId: req.params.comicId,
      }
    });

    if (!progress) {
      throw errors.notFound('Прогресс чтения не найден');
    }

    const updates: any = {};

    if (currentPageId) updates.currentPageId = currentPageId;
    if (visitedPages?.length > progress.visitedPages.length) {
      updates.visitedPages = visitedPages;
    }
    if (choicesHistory?.length > progress.choicesHistory.length) {
      updates.choicesHistory = choicesHistory;
    }
    if (variables) updates.variables = variables;
    if (inventory) updates.inventory = inventory;
    if (totalTimeSeconds > progress.totalTimeSeconds) {
      updates.totalTimeSeconds = totalTimeSeconds;
    }

    await progress.update(updates);

    res.json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
