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

export type StudioNode = {
  id: string;
  title: string;
  imageFileId: string | null;
  imageUrl?: string | null;
  order: number;
  isEnding: boolean;
  buttons: HotspotButton[];
};

export type DraftPayloadV2 = {
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

export function createDefaultPayload(input: {
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

function normalizeButton(button: any, fallbackId: string): HotspotButton {
  return {
    id: String(button.id || fallbackId),
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
  };
}

export function normalizePayload(rawPayload: any): DraftPayloadV2 {
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
          ? node.buttons.map((btn: any, bi: number) =>
              normalizeButton(btn, `${node.id || `node-${index + 1}`}-btn-${bi + 1}`)
            )
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
      ? page.choices.map((choice: any, choiceIndex: number) =>
          normalizeButton(
            {
              id: choice.id || choice.choiceId,
              text: choice.text,
              targetNodeId: choice.targetPageId,
              y: 10 + choiceIndex * 60,
              w: 220,
            },
            `btn-${choiceIndex + 1}`
          )
        )
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
