import { Router } from 'express';
import { Op } from 'sequelize';
import { Comic, ComicPage, ComicRevision, ComicComment, ComicRating, ReadingProgress, UserFavorite, UploadedFile, User } from '../models/index.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { errors } from '../middleware/errorHandler.js';
import { createUploadMiddleware, persistUploadedFile } from '../services/uploadService.js';

const router = Router();
const uploadCreatorImage = createUploadMiddleware({ fieldName: 'image', subDir: 'creator' });

type HotspotButton = {
  id: string;
  text: string;
  targetNodeId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  radius: number;
  fontSize: number;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
  visible: boolean;
};

type StudioNode = {
  id: string;
  title: string;
  imageFileId: string | null;
  imageUrl?: string | null;
  order: number;
  isEnding: boolean;
  buttons: HotspotButton[];
};

type DraftPayloadV2 = {
  schemaVersion: 2;
  comicMeta: {
    title: string;
    description: string;
    coverFileId: string | null;
    coverImage?: string;
    genres: string[];
    tags: string[];
    startNodeId: string;
    estimatedMinutes: number;
  };
  nodes: StudioNode[];
};

function createDefaultPayload(input: {
  title: string;
  description: string;
  coverFileId?: string | null;
  coverImage?: string;
  genres?: string[];
  tags?: string[];
  estimatedMinutes?: number;
}): DraftPayloadV2 {
  return {
    schemaVersion: 2,
    comicMeta: {
      title: input.title,
      description: input.description,
      coverFileId: input.coverFileId || null,
      coverImage: input.coverImage || '',
      genres: input.genres || [],
      tags: input.tags || [],
      startNodeId: 'node-1',
      estimatedMinutes: input.estimatedMinutes || 5,
    },
    nodes: [
      {
        id: 'node-1',
        title: 'Стартовая сцена',
        imageFileId: null,
        imageUrl: '',
        order: 1,
        isEnding: false,
        buttons: [],
      },
    ],
  };
}

function normalizePayload(rawPayload: any): DraftPayloadV2 {
  if (rawPayload?.schemaVersion === 2 && rawPayload?.comicMeta && Array.isArray(rawPayload?.nodes)) {
    return {
      schemaVersion: 2,
      comicMeta: {
        title: String(rawPayload.comicMeta.title || ''),
        description: String(rawPayload.comicMeta.description || ''),
        coverFileId: rawPayload.comicMeta.coverFileId || null,
        coverImage: String(rawPayload.comicMeta.coverImage || ''),
        genres: Array.isArray(rawPayload.comicMeta.genres) ? rawPayload.comicMeta.genres : [],
        tags: Array.isArray(rawPayload.comicMeta.tags) ? rawPayload.comicMeta.tags : [],
        startNodeId: String(rawPayload.comicMeta.startNodeId || 'node-1'),
        estimatedMinutes: Number(rawPayload.comicMeta.estimatedMinutes || 5),
      },
      nodes: rawPayload.nodes.map((node: any, index: number) => ({
        id: String(node.id || `node-${index + 1}`),
        title: String(node.title || ''),
        imageFileId: node.imageFileId || null,
        imageUrl: node.imageUrl || '',
        order: Number(node.order || index + 1),
        isEnding: Boolean(node.isEnding),
        buttons: Array.isArray(node.buttons)
          ? node.buttons.map((button: any, buttonIndex: number) => ({
              id: String(button.id || `${node.id || `node-${index + 1}`}-btn-${buttonIndex + 1}`),
              text: String(button.text || ''),
              targetNodeId: String(button.targetNodeId || ''),
              x: Number(button.x ?? 10),
              y: Number(button.y ?? 10),
              w: Number(button.w ?? 160),
              h: Number(button.h ?? 52),
              bgColor: String(button.bgColor || '#F4745F'),
              textColor: String(button.textColor || '#1C1614'),
              borderColor: String(button.borderColor || '#1C1614'),
              borderWidth: Number(button.borderWidth ?? 2),
              opacity: Number(button.opacity ?? 1),
              radius: Number(button.radius ?? 12),
              fontSize: Number(button.fontSize ?? 16),
              fontWeight: Number(button.fontWeight ?? 700),
              textAlign: ['left', 'center', 'right'].includes(button.textAlign) ? button.textAlign : 'center',
              visible: button.visible !== false,
            }))
          : [],
      })),
    };
  }

  const legacyComic = rawPayload?.comic || {};
  const legacyPages = Array.isArray(rawPayload?.pages) ? rawPayload.pages : [];
  const nodes: StudioNode[] = legacyPages.map((page: any, index: number) => ({
    id: String(page.pageId || `node-${index + 1}`),
    title: String(page.title || ''),
    imageFileId: null,
    imageUrl: page?.panels?.[0]?.imageUrl || '',
    order: index + 1,
    isEnding: Boolean(page.isEnding),
    buttons: Array.isArray(page.choices)
      ? page.choices.map((choice: any, choiceIndex: number) => ({
          id: String(choice.id || choice.choiceId || `btn-${choiceIndex + 1}`),
          text: String(choice.text || ''),
          targetNodeId: String(choice.targetPageId || ''),
          x: 10,
          y: 10 + choiceIndex * 60,
          w: 220,
          h: 52,
          bgColor: '#F4745F',
          textColor: '#1C1614',
          borderColor: '#1C1614',
          borderWidth: 2,
          opacity: 1,
          radius: 12,
          fontSize: 16,
          fontWeight: 700,
          textAlign: 'center',
          visible: true,
        }))
      : [],
  }));

  const fallbackNodes = nodes.length > 0 ? nodes : createDefaultPayload({ title: '', description: '' }).nodes;

  return {
    schemaVersion: 2,
    comicMeta: {
      title: String(legacyComic.title || ''),
      description: String(legacyComic.description || ''),
      coverFileId: null,
      coverImage: String(legacyComic.coverImage || ''),
      genres: Array.isArray(legacyComic.genres) ? legacyComic.genres : [],
      tags: Array.isArray(legacyComic.tags) ? legacyComic.tags : [],
      startNodeId: String(legacyComic.startPageId || fallbackNodes[0].id),
      estimatedMinutes: Number(legacyComic.estimatedMinutes || 5),
    },
    nodes: fallbackNodes,
  };
}

async function ensureComicAccess(req: AuthRequest, comicId: string) {
  const comic = await Comic.findByPk(comicId);
  if (!comic) {
    throw errors.notFound('Комикс не найден');
  }

  if (req.user!.role !== 'admin' && comic.authorId !== req.user!.id) {
    throw errors.forbidden('Нет доступа к этому комиксу');
  }

  return comic;
}

async function getLatestRevision(comicId: string) {
  return ComicRevision.findOne({
    where: { comicId },
    order: [['version', 'DESC']],
  });
}

async function resolveCoverImage(coverFileId: string | null | undefined) {
  if (!coverFileId) return '';
  const file = await UploadedFile.findByPk(coverFileId);
  return file?.publicUrl || '';
}

async function validateDraftForSubmit(payload: DraftPayloadV2, userId: string, isAdmin: boolean) {
  const errorsList: string[] = [];
  const warnings: string[] = [];

  const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
  if (nodes.length < 1) {
    errorsList.push('Добавьте минимум один узел (изображение).');
  }

  const nodeMap = new Map<string, StudioNode>();
  for (const node of nodes) {
    if (!node.id) {
      errorsList.push('У каждого узла должен быть id.');
      continue;
    }
    if (nodeMap.has(node.id)) {
      errorsList.push(`Дублирующийся node.id: ${node.id}`);
      continue;
    }
    nodeMap.set(node.id, node);
  }

  if (!payload.comicMeta?.startNodeId || !nodeMap.has(payload.comicMeta.startNodeId)) {
    errorsList.push('startNodeId должен ссылаться на существующий узел.');
  }

  for (const node of nodes) {
    if (!node.isEnding && (!Array.isArray(node.buttons) || node.buttons.length === 0)) {
      errorsList.push(`Узел ${node.id} не является финалом и должен иметь хотя бы одну кнопку.`);
    }

    for (const button of node.buttons || []) {
      if (!button.targetNodeId || !nodeMap.has(button.targetNodeId)) {
        errorsList.push(`Кнопка ${button.id} в узле ${node.id} ссылается на несуществующий targetNodeId.`);
      }
    }
  }

  if (payload.comicMeta?.startNodeId && nodeMap.has(payload.comicMeta.startNodeId)) {
    const visited = new Set<string>();
    const queue = [payload.comicMeta.startNodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = nodeMap.get(current);
      if (!node) continue;

      for (const button of node.buttons || []) {
        if (nodeMap.has(button.targetNodeId)) {
          queue.push(button.targetNodeId);
        }
      }
    }

    const hasReachableEnding = Array.from(visited).some((nodeId) => nodeMap.get(nodeId)?.isEnding);
    if (!hasReachableEnding) {
      errorsList.push('От startNodeId должна быть достижима минимум одна ending-сцена.');
    }

    for (const nodeId of nodeMap.keys()) {
      if (!visited.has(nodeId)) {
        warnings.push(`Недостижимый узел: ${nodeId}`);
      }
    }
  }

  const imageFileIds = Array.from(
    new Set(
      nodes
        .map((node) => node.imageFileId)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (imageFileIds.length > 0) {
    const files = await UploadedFile.findAll({
      where: {
        id: { [Op.in]: imageFileIds },
      },
    });
    const fileMap = new Map(files.map((file) => [file.id, file]));

    for (const node of nodes) {
      if (!node.imageFileId) continue;

      const file = fileMap.get(node.imageFileId);
      if (!file) {
        errorsList.push(`Узел ${node.id} ссылается на несуществующий imageFileId.`);
        continue;
      }

      if (!file.mimeType.startsWith('image/')) {
        errorsList.push(`Узел ${node.id} использует файл не image/*.`);
      }

      if (!isAdmin && file.ownerUserId !== userId) {
        errorsList.push(`Узел ${node.id} использует чужой файл.`);
      }
    }
  }

  return { errorsList, warnings };
}

router.use(authenticate, authorize('creator', 'admin'));

router.get('/comics', async (req: AuthRequest, res, next) => {
  try {
    const where = req.user!.role === 'admin' ? {} : { authorId: req.user!.id };

    const comics = await Comic.findAll({
      where,
      order: [['updatedAt', 'DESC']],
    });

    const items = await Promise.all(
      comics.map(async (comic) => {
        const latestRevision = await getLatestRevision(comic.id);
        const hiddenReason =
          latestRevision?.status === 'rejected' && comic.authorId !== req.user!.id && req.user!.role !== 'admin';

        return {
          comic,
          latestRevision: latestRevision
            ? {
                id: latestRevision.id,
                version: latestRevision.version,
                status: latestRevision.status,
                submittedAt: latestRevision.submittedAt,
                reviewedAt: latestRevision.reviewedAt,
                rejectionReason: hiddenReason ? null : latestRevision.rejectionReason,
              }
            : null,
        };
      })
    );

    res.json({
      success: true,
      data: { items },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/comics', async (req: AuthRequest, res, next) => {
  try {
    const { title, description, coverFileId, genres, tags, estimatedMinutes } = req.body;

    if (!title || !description) {
      throw errors.badRequest('Название и описание обязательны');
    }

    const coverImage = await resolveCoverImage(coverFileId);
    const payload = createDefaultPayload({
      title,
      description,
      coverFileId,
      coverImage,
      genres,
      tags,
      estimatedMinutes,
    });

    const author = await User.findByPk(req.user!.id);

    const comic = await Comic.create({
      title: payload.comicMeta.title,
      description: payload.comicMeta.description,
      coverImage: payload.comicMeta.coverImage || '',
      authorId: req.user!.id,
      authorName: author?.creatorNick || author?.displayName || author?.email || 'creator',
      genres: payload.comicMeta.genres,
      tags: payload.comicMeta.tags,
      size: 'small',
      startPageId: payload.comicMeta.startNodeId,
      status: 'draft',
      estimatedMinutes: payload.comicMeta.estimatedMinutes,
      totalPages: payload.nodes.length,
      totalEndings: payload.nodes.filter((node) => node.isEnding).length,
    });

    const revision = await ComicRevision.create({
      comicId: comic.id,
      version: 1,
      status: 'draft',
      payloadJson: payload,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: { comic, revision },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/comics/:comicId/draft', async (req: AuthRequest, res, next) => {
  try {
    const comic = await ensureComicAccess(req, req.params.comicId);
    const latestRevision = await getLatestRevision(comic.id);

    if (!latestRevision) {
      throw errors.notFound('Черновик не найден');
    }

    const normalizedPayload = normalizePayload(latestRevision.payloadJson);

    res.json({
      success: true,
      data: {
        comic,
        revision: {
          ...latestRevision.get({ plain: true }),
          payloadJson: normalizedPayload,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/comics/:comicId/draft', async (req: AuthRequest, res, next) => {
  try {
    const comic = await ensureComicAccess(req, req.params.comicId);
    const incomingPayload = req.body?.payload;

    if (!incomingPayload) {
      throw errors.badRequest('Данные обязательны');
    }

    const payload = normalizePayload(incomingPayload);

    if (payload.comicMeta.coverFileId) {
      const coverImage = await resolveCoverImage(payload.comicMeta.coverFileId);
      if (coverImage) {
        payload.comicMeta.coverImage = coverImage;
      }
    }

    const latest = await getLatestRevision(comic.id);

    if (!latest) {
      throw errors.notFound('Черновик не найден');
    }

    if (latest.status === 'draft' || latest.status === 'rejected') {
      await latest.update({
        payloadJson: payload,
        rejectionReason: null,
      });

      return res.json({
        success: true,
        data: { revision: latest },
      });
    }

    const newRevision = await ComicRevision.create({
      comicId: comic.id,
      version: latest.version + 1,
      status: 'draft',
      payloadJson: payload,
      createdBy: req.user!.id,
    });

    res.json({
      success: true,
      data: { revision: newRevision },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/comics/:comicId/submit', async (req: AuthRequest, res, next) => {
  try {
    const comic = await ensureComicAccess(req, req.params.comicId);
    const latest = await getLatestRevision(comic.id);

    if (!latest) {
      throw errors.notFound('Черновик не найден');
    }

    if (!['draft', 'rejected'].includes(latest.status)) {
      throw errors.badRequest('Отправить можно только черновик или отклонённую ревизию');
    }

    const payload = normalizePayload(latest.payloadJson);
    const { errorsList, warnings } = await validateDraftForSubmit(
      payload,
      req.user!.id,
      req.user!.role === 'admin'
    );

    if (errorsList.length > 0) {
      throw errors.validation('Ошибка валидации черновика', {
        errors: errorsList,
        warnings,
      });
    }

    await latest.update({
      payloadJson: payload,
      status: 'pending_review',
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
    });

    if (comic.status !== 'published') {
      await comic.update({ status: 'pending_review' });
    }

    res.json({
      success: true,
      data: {
        revision: latest,
        comicStatus: comic.status === 'published' ? 'published' : 'pending_review',
        warnings,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/comics/:comicId', async (req: AuthRequest, res, next) => {
  try {
    const comic = await ensureComicAccess(req, req.params.comicId);

    await ComicRevision.destroy({ where: { comicId: comic.id } });
    await ComicPage.destroy({ where: { comicId: comic.id } });
    await ComicComment.destroy({ where: { comicId: comic.id } });
    await ComicRating.destroy({ where: { comicId: comic.id } });
    await ReadingProgress.destroy({ where: { comicId: comic.id } });
    await UserFavorite.destroy({ where: { comicId: comic.id } });
    await comic.destroy();

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});

router.post('/uploads/image', uploadCreatorImage, async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      throw errors.badRequest('Изображение не загружено');
    }

    const { record, publicUrl } = await persistUploadedFile({
      ownerUserId: req.user!.id,
      file: req.file,
      subDir: 'creator',
    });

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
        url: publicUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
