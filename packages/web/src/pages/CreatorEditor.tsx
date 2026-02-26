import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronDown, Eye, Plus, RotateCcw, Save, Send, Trash2 } from 'lucide-react';
import { creatorApi, uploadsApi } from '../services/api';
import { Button, LinkButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Tag } from '../components/ui/Tag';

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

type ImageNode = {
  id: string;
  title: string;
  imageFileId: string | null;
  imageUrl: string;
  order: number;
  isEnding: boolean;
  buttons: HotspotButton[];
};

type DraftPayload = {
  schemaVersion: 2;
  comicMeta: {
    title: string;
    description: string;
    coverFileId: string | null;
    coverImage: string;
    genres: string[];
    tags: string[];
    startNodeId: string;
    estimatedMinutes: number;
  };
  nodes: ImageNode[];
};

type DragState = {
  nodeId: string;
  buttonId: string;
  mode: 'move' | 'resize';
  startPointerX: number;
  startPointerY: number;
  startButton: Pick<HotspotButton, 'x' | 'y' | 'w' | 'h'>;
};

const WORKSPACE_WIDTH = 1600;
const WORKSPACE_HEIGHT = 900;
const MIN_BUTTON_WIDTH = 6;
const MIN_BUTTON_HEIGHT = 4;
const PREVIEW_SCALE = 0.42;

const IMAGE_FRAME_PERCENT = {
  x: 2,
  y: 2,
  w: 96,
  h: 78,
};

const uid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 100000)}`;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 100) / 100;

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAxisValue = (value: unknown, axis: 'x' | 'y') => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;

  if (parsed > 100 || parsed < 0) {
    const size = axis === 'x' ? WORKSPACE_WIDTH : WORKSPACE_HEIGHT;
    return round((parsed / size) * 100);
  }

  return parsed;
};

const normalizeSizeValue = (value: unknown, axis: 'x' | 'y', fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  if (parsed > 100 || parsed < 0) {
    const size = axis === 'x' ? WORKSPACE_WIDTH : WORKSPACE_HEIGHT;
    return round((parsed / size) * 100);
  }

  return parsed;
};

const createNode = (index: number): ImageNode => ({
  id: `node-${index}`,
  title: `Сцена ${index}`,
  imageFileId: null,
  imageUrl: '',
  order: index,
  isEnding: false,
  buttons: [],
});

const createButton = (targetNodeId: string): HotspotButton => ({
  id: uid(),
  text: 'Выбор',
  targetNodeId,
  x: 34,
  y: 72,
  w: 28,
  h: 9,
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
});

const defaultPayload: DraftPayload = {
  schemaVersion: 2,
  comicMeta: {
    title: '',
    description: '',
    coverFileId: null,
    coverImage: '',
    genres: [],
    tags: [],
    startNodeId: 'node-1',
    estimatedMinutes: 8,
  },
  nodes: [createNode(1)],
};

const normalizeButton = (button: any, nodeId: string, buttonIndex: number): HotspotButton => {
  const width = clamp(normalizeSizeValue(button.w, 'x', 24), MIN_BUTTON_WIDTH, 100);
  const height = clamp(normalizeSizeValue(button.h, 'y', 8), MIN_BUTTON_HEIGHT, 100);
  const x = clamp(normalizeAxisValue(button.x, 'x'), 0, 100 - width);
  const y = clamp(normalizeAxisValue(button.y, 'y'), 0, 100 - height);

  return {
    id: String(button.id || `${nodeId}-btn-${buttonIndex + 1}`),
    text: String(button.text || 'Выбор'),
    targetNodeId: String(button.targetNodeId || ''),
    x: round(x),
    y: round(y),
    w: round(width),
    h: round(height),
    bgColor: String(button.bgColor || '#F4745F'),
    textColor: String(button.textColor || '#1C1614'),
    borderColor: String(button.borderColor || '#1C1614'),
    borderWidth: clamp(Number(button.borderWidth ?? 2), 0, 24),
    opacity: clamp(Number(button.opacity ?? 1), 0, 1),
    radius: clamp(Number(button.radius ?? 12), 0, 100),
    fontSize: clamp(Number(button.fontSize ?? 16), 10, 72),
    fontWeight: clamp(Number(button.fontWeight ?? 700), 300, 900),
    textAlign: ['left', 'center', 'right'].includes(button.textAlign) ? button.textAlign : 'center',
    visible: button.visible !== false,
  };
};

function formatDraftPayload(input: any): DraftPayload {
  if (input?.schemaVersion === 2 && input?.comicMeta && Array.isArray(input?.nodes)) {
    const nodes: ImageNode[] = input.nodes.length
      ? input.nodes.map((node: any, index: number) => {
          const id = String(node.id || `node-${index + 1}`);
          return {
            id,
            title: String(node.title || `Сцена ${index + 1}`),
            imageFileId: node.imageFileId || null,
            imageUrl: String(node.imageUrl || ''),
            order: Number(node.order || index + 1),
            isEnding: Boolean(node.isEnding),
            buttons: Array.isArray(node.buttons)
              ? node.buttons.map((button: any, buttonIndex: number) => normalizeButton(button, id, buttonIndex))
              : [],
          };
        })
      : [createNode(1)];

    const startNodeId = String(input.comicMeta.startNodeId || nodes[0].id);

    return {
      schemaVersion: 2,
      comicMeta: {
        title: String(input.comicMeta.title || ''),
        description: String(input.comicMeta.description || ''),
        coverFileId: input.comicMeta.coverFileId || null,
        coverImage: String(input.comicMeta.coverImage || ''),
        genres: Array.isArray(input.comicMeta.genres) ? input.comicMeta.genres.map(String) : [],
        tags: Array.isArray(input.comicMeta.tags) ? input.comicMeta.tags.map(String) : [],
        startNodeId: nodes.some((node) => node.id === startNodeId) ? startNodeId : nodes[0].id,
        estimatedMinutes: clamp(Number(input.comicMeta.estimatedMinutes || 8), 1, 999),
      },
      nodes,
    };
  }

  return defaultPayload;
}

function validateGraph(payload: DraftPayload) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeMap = new Map(payload.nodes.map((node) => [node.id, node]));

  if (!nodeMap.has(payload.comicMeta.startNodeId)) {
    errors.push('Стартовая сцена не найдена.');
    return { errors, warnings };
  }

  const nodesWithoutImages: string[] = [];

  payload.nodes.forEach((node) => {
    if (!node.isEnding && node.buttons.length === 0) {
      errors.push(`«${node.title || node.id}»: добавьте хотя бы одну кнопку перехода.`);
    }

    if (!node.imageUrl && !node.imageFileId) {
      nodesWithoutImages.push(node.title || node.id);
    }

    node.buttons.forEach((button) => {
      if (!button.targetNodeId || !nodeMap.has(button.targetNodeId)) {
        errors.push(`«${node.title || node.id}»: кнопка «${button.text || '...'}» ведёт в несуществующую сцену.`);
      }
      if (button.targetNodeId === node.id) {
        warnings.push(`«${node.title || node.id}»: кнопка «${button.text || '...'}» ведёт в эту же сцену.`);
      }
    });

    const uniqueTargets = new Set(node.buttons.map((b) => b.targetNodeId));
    if (uniqueTargets.size < node.buttons.length) {
      warnings.push(`«${node.title || node.id}»: есть дублирующиеся переходы.`);
    }
  });

  if (nodesWithoutImages.length > 0) {
    warnings.push(`Нет изображения: ${nodesWithoutImages.join(', ')}`);
  }

  const visited = new Set<string>();
  const queue = [payload.comicMeta.startNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = nodeMap.get(current);
    if (!node) continue;

    node.buttons.forEach((button) => {
      if (nodeMap.has(button.targetNodeId)) queue.push(button.targetNodeId);
    });
  }

  payload.nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      errors.push(`«${node.title || node.id}»: сцена недостижима из старта.`);
    }
  });

  const reachableEndings = Array.from(visited).filter((nodeId) => nodeMap.get(nodeId)?.isEnding);
  if (reachableEndings.length === 0) {
    errors.push('Из стартовой сцены должна быть достижима минимум одна финальная сцена.');
  }

  const totalEndings = payload.nodes.filter((n) => n.isEnding).length;
  if (totalEndings === 0) {
    errors.push('Отметьте хотя бы одну сцену как финальную.');
  }

  return { errors, warnings };
}

const splitByComma = (input: string) =>
  input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const GENRE_OPTIONS: { key: string; label: string }[] = [
  { key: 'adventure', label: 'Приключения' },
  { key: 'fantasy', label: 'Фэнтези' },
  { key: 'scifi', label: 'Научная фантастика' },
  { key: 'horror', label: 'Ужасы' },
  { key: 'romance', label: 'Романтика' },
  { key: 'mystery', label: 'Детектив' },
  { key: 'action', label: 'Экшен' },
  { key: 'cyberpunk', label: 'Киберпанк' },
  { key: 'comedy', label: 'Комедия' },
  { key: 'drama', label: 'Драма' },
  { key: 'thriller', label: 'Триллер' },
];

export default function CreatorEditor() {
  const { comicId } = useParams<{ comicId: string }>();
  const navigate = useNavigate();

  const [payload, setPayload] = useState<DraftPayload>(defaultPayload);
  const [selectedNodeId, setSelectedNodeId] = useState(defaultPayload.nodes[0].id);
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);

  const [previewNodeId, setPreviewNodeId] = useState(defaultPayload.nodes[0].id);
  const [previewHistory, setPreviewHistory] = useState<string[]>([]);

  const [genresInput, setGenresInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState('');

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editorScale, setEditorScale] = useState(1);

  const autosaveTimerRef = useRef<number | null>(null);
  const hydratedRef = useRef(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedNode = useMemo(
    () => payload.nodes.find((node) => node.id === selectedNodeId) || payload.nodes[0] || null,
    [payload.nodes, selectedNodeId]
  );

  const selectedButton = useMemo(
    () => selectedNode?.buttons.find((button) => button.id === selectedButtonId) || null,
    [selectedNode, selectedButtonId]
  );

  const previewNode = useMemo(
    () => payload.nodes.find((node) => node.id === previewNodeId) || payload.nodes.find((node) => node.id === payload.comicMeta.startNodeId) || payload.nodes[0] || null,
    [payload.nodes, previewNodeId, payload.comicMeta.startNodeId]
  );

  const graphValidation = useMemo(() => validateGraph(payload), [payload]);

  const updateMeta = (patch: Partial<DraftPayload['comicMeta']>) => {
    setPayload((prev) => ({
      ...prev,
      comicMeta: { ...prev.comicMeta, ...patch },
    }));
  };

  const updateNode = (nodeId: string, patch: Partial<ImageNode>) => {
    setPayload((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
    }));
  };

  const updateButton = (nodeId: string, buttonId: string, patch: Partial<HotspotButton>) => {
    setPayload((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          buttons: node.buttons.map((button) => (button.id === buttonId ? { ...button, ...patch } : button)),
        };
      }),
    }));
  };

  const loadDraft = async (targetComicId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await creatorApi.getDraft(targetComicId);
      const incoming = response.data.data.revision?.payloadJson;
      const normalized = formatDraftPayload(incoming);
      const firstNodeId = normalized.nodes[0]?.id || 'node-1';
      const startNodeId = normalized.nodes.some((node) => node.id === normalized.comicMeta.startNodeId)
        ? normalized.comicMeta.startNodeId
        : firstNodeId;

      setPayload(normalized);
      setSelectedNodeId(startNodeId);
      setSelectedButtonId(null);
      setPreviewNodeId(startNodeId);
      setPreviewHistory([]);
      setGenresInput(normalized.comicMeta.genres.join(', '));
      setTagsInput(normalized.comicMeta.tags.join(', '));
      hydratedRef.current = true;
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить черновик.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!comicId) return;

    if (comicId === 'new') {
      creatorApi
        .createComic({ title: 'Новый комикс', description: 'Черновик', estimatedMinutes: 8 })
        .then((response) => {
          navigate(`/creator/editor/${response.data.data.comic.id}`, { replace: true });
        })
        .catch((err: any) => {
          setError(err?.response?.data?.error?.message || 'Не удалось создать черновик.');
        });
      return;
    }

    loadDraft(comicId);
  }, [comicId, navigate]);

  useEffect(() => {
    if (!comicId || comicId === 'new' || !hydratedRef.current) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    setAutosaveState('idle');
    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        setAutosaveState('saving');
        await creatorApi.saveDraft(comicId, payload);
        setAutosaveState('saved');
        setLastSavedAt(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
      } catch {
        setAutosaveState('error');
      }
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [payload, comicId]);

  useEffect(() => {
    if (!selectedNode) return;

    if (!payload.nodes.some((node) => node.id === selectedNode.id)) {
      setSelectedNodeId(payload.nodes[0]?.id || 'node-1');
    }

    if (selectedButtonId && !selectedNode.buttons.some((button) => button.id === selectedButtonId)) {
      setSelectedButtonId(null);
    }

    if (!payload.nodes.some((node) => node.id === previewNodeId)) {
      setPreviewNodeId(payload.comicMeta.startNodeId || payload.nodes[0]?.id || 'node-1');
      setPreviewHistory([]);
    }
  }, [payload.nodes, payload.comicMeta.startNodeId, previewNodeId, selectedButtonId, selectedNode]);

  const scrollObsRef = useRef<ResizeObserver | null>(null);

  const scrollContainerRefCb = (el: HTMLDivElement | null) => {
    if (scrollObsRef.current) {
      scrollObsRef.current.disconnect();
      scrollObsRef.current = null;
    }
    scrollContainerRef.current = el;
    if (!el) return;
    const measure = () => {
      const available = el.clientWidth - 24;
      setEditorScale(Math.min(1, available / WORKSPACE_WIDTH));
    };
    measure();
    scrollObsRef.current = new ResizeObserver(measure);
    scrollObsRef.current.observe(el);
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (event: PointerEvent) => {
      const workspace = workspaceRef.current;
      if (!workspace) return;
      const rect = workspace.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaX = ((event.clientX - dragState.startPointerX) / rect.width) * 100;
      const deltaY = ((event.clientY - dragState.startPointerY) / rect.height) * 100;

      setPayload((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => {
          if (node.id !== dragState.nodeId) return node;

          return {
            ...node,
            buttons: node.buttons.map((button) => {
              if (button.id !== dragState.buttonId) return button;

              if (dragState.mode === 'move') {
                const nextX = clamp(dragState.startButton.x + deltaX, 0, 100 - dragState.startButton.w);
                const nextY = clamp(dragState.startButton.y + deltaY, 0, 100 - dragState.startButton.h);
                return { ...button, x: round(nextX), y: round(nextY) };
              }

              const nextW = clamp(dragState.startButton.w + deltaX, MIN_BUTTON_WIDTH, 100 - dragState.startButton.x);
              const nextH = clamp(dragState.startButton.h + deltaY, MIN_BUTTON_HEIGHT, 100 - dragState.startButton.y);
              return { ...button, w: round(nextW), h: round(nextH) };
            }),
          };
        }),
      }));
    };

    const handleEnd = () => setDragState(null);

    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);

    return () => {
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };
  }, [dragState]);

  const autosaveLabel =
    autosaveState === 'saving'
      ? 'Автосохранение...'
      : autosaveState === 'saved'
        ? `Сохранено в ${lastSavedAt || 'только что'}`
        : autosaveState === 'error'
          ? 'Ошибка автосохранения'
          : 'Черновик изменён';

  const save = async () => {
    if (!comicId || comicId === 'new') return;

    setSaving(true);
    setError('');

    try {
      await creatorApi.saveDraft(comicId, payload);
      setAutosaveState('saved');
      setLastSavedAt(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setAutosaveState('error');
      setError(err?.response?.data?.error?.message || 'Не удалось сохранить черновик.');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!comicId || comicId === 'new') return;

    setError('');
    if (graphValidation.errors.length > 0) {
      setError('Перед отправкой исправьте ошибки графа.');
      return;
    }

    setSaving(true);
    try {
      await creatorApi.saveDraft(comicId, payload);
      await creatorApi.submitComic(comicId);
      navigate('/creator/studio');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось отправить на модерацию.');
    } finally {
      setSaving(false);
    }
  };

  const addNode = () => {
    const nextIndex = payload.nodes.length + 1;
    const node: ImageNode = {
      ...createNode(nextIndex),
      id: `node-${uid().slice(0, 8)}`,
      order: nextIndex,
    };

    setPayload((prev) => ({
      ...prev,
      nodes: [...prev.nodes, node],
    }));

    setSelectedNodeId(node.id);
    setSelectedButtonId(null);
  };

  const removeNode = (nodeId: string) => {
    if (payload.nodes.length <= 1) return;

    const nextNodes = payload.nodes.filter((node) => node.id !== nodeId);
    const fallback = nextNodes[0];
    if (!fallback) return;

    setPayload((prev) => ({
      ...prev,
      comicMeta: {
        ...prev.comicMeta,
        startNodeId: prev.comicMeta.startNodeId === nodeId ? fallback.id : prev.comicMeta.startNodeId,
      },
      nodes: nextNodes.map((node, index) => ({
        ...node,
        order: index + 1,
        buttons: node.buttons.map((button) => ({
          ...button,
          targetNodeId: button.targetNodeId === nodeId ? fallback.id : button.targetNodeId,
        })),
      })),
    }));

    if (selectedNodeId === nodeId) setSelectedNodeId(fallback.id);
    if (previewNodeId === nodeId) setPreviewNodeId(fallback.id);
    setSelectedButtonId(null);
  };

  const addButton = () => {
    if (!selectedNode) return;

    const fallbackTarget = payload.nodes[0]?.id || selectedNode.id;
    const button = createButton(fallbackTarget);

    updateNode(selectedNode.id, { buttons: [...selectedNode.buttons, button] });
    setSelectedButtonId(button.id);
  };

  const removeButton = (buttonId: string) => {
    if (!selectedNode) return;

    updateNode(selectedNode.id, {
      buttons: selectedNode.buttons.filter((button) => button.id !== buttonId),
    });

    if (selectedButtonId === buttonId) setSelectedButtonId(null);
  };

  const beginButtonDrag = (
    event: ReactPointerEvent<HTMLElement>,
    button: HotspotButton,
    mode: DragState['mode']
  ) => {
    if (!selectedNode) return;

    event.preventDefault();
    event.stopPropagation();

    setSelectedButtonId(button.id);
    setDragState({
      nodeId: selectedNode.id,
      buttonId: button.id,
      mode,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startButton: {
        x: button.x,
        y: button.y,
        w: button.w,
        h: button.h,
      },
    });
  };

  const updateSelectedButton = (patch: Partial<HotspotButton>) => {
    if (!selectedNode || !selectedButton) return;
    updateButton(selectedNode.id, selectedButton.id, patch);
  };

  const uploadCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadsApi.uploadFile(file, 'comic-cover');
      const uploaded = response.data.data.file;
      updateMeta({ coverFileId: uploaded.id, coverImage: uploaded.publicUrl });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить обложку.');
    }
  };

  const uploadNodeImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedNode) return;

    try {
      const response = await uploadsApi.uploadFile(file, 'comic-node-image');
      const uploaded = response.data.data.file;
      updateNode(selectedNode.id, { imageFileId: uploaded.id, imageUrl: uploaded.publicUrl });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить изображение сцены.');
    }
  };

  const startPreview = () => {
    const startId = payload.comicMeta.startNodeId || payload.nodes[0]?.id || 'node-1';
    setPreviewNodeId('');
    setPreviewHistory([]);
    requestAnimationFrame(() => setPreviewNodeId(startId));
  };

  const previewBack = () => {
    const prevNodeId = previewHistory[previewHistory.length - 1];
    if (!prevNodeId) return;

    setPreviewHistory((prev) => prev.slice(0, -1));
    setPreviewNodeId(prevNodeId);
  };

  const goToPreviewNode = (targetNodeId: string) => {
    if (!previewNode || !payload.nodes.some((node) => node.id === targetNodeId)) return;
    setPreviewHistory((prev) => [...prev, previewNode.id]);
    setPreviewNodeId(targetNodeId);
  };

  const previewTrail = useMemo(() => {
    const ids = [...previewHistory, previewNode?.id].filter(Boolean) as string[];
    return ids.map((id) => payload.nodes.find((node) => node.id === id)?.title || id).join(' → ');
  }, [payload.nodes, previewHistory, previewNode?.id]);

  if (loading) {
    return (
      <section className="page">
        <div className="container notice">Загрузка редактора...</div>
      </section>
    );
  }

  if (!selectedNode) {
    return (
      <section className="page">
        <div className="container notice">Нет выбранной сцены.</div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="container stack creator-editor-page">
        <SectionHeader
          title="Редактор комикса"
          subtitle="Перетаскивайте кнопки прямо в рабочей области и проверяйте прохождение перед модерацией"
          actions={
            <div className="cluster">
              <Tag tone={autosaveState === 'error' ? 'accent' : 'soft'}>{autosaveLabel}</Tag>
              <LinkButton to="/creator/studio" variant="ghost" size="md">
                К студии
              </LinkButton>
              <Button variant="outline" size="md" onClick={save} disabled={saving} leftIcon={<Save size={14} />}>
                Сохранить
              </Button>
              <Button size="md" onClick={submit} disabled={saving} leftIcon={<Send size={14} />}>
                На модерацию
              </Button>
            </div>
          }
        />

        {error ? <div className="alert alert-error">{error}</div> : null}

        <div className="creator-editor-layout">
          <aside className="creator-editor-column">
            <Card className="stack">
              <div className="row-between">
                <strong>Сцены</strong>
                <Button variant="outline" size="sm" onClick={addNode} leftIcon={<Plus size={14} />}>
                  Добавить сцену
                </Button>
              </div>

              <div className="node-map">
                {payload.nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`node-map-item ${selectedNode.id === node.id ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedButtonId(null);
                      setPreviewNodeId(node.id);
                      setPreviewHistory([]);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedNodeId(node.id);
                        setSelectedButtonId(null);
                        setPreviewNodeId(node.id);
                        setPreviewHistory([]);
                      }
                    }}
                  >
                    <div className="node-map-item-main">
                      <strong>{node.title || node.id}</strong>
                      <span className="field-hint">{node.id}</span>
                    </div>

                    <div className="cluster">
                      {payload.comicMeta.startNodeId === node.id ? <Tag tone="accent">Старт</Tag> : null}
                      {node.isEnding ? <Tag tone="soft">Финал</Tag> : null}
                      <button
                        className="icon-action"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeNode(node.id);
                        }}
                        disabled={payload.nodes.length <= 1}
                        aria-label={`Удалить ${node.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="stack">
              <strong>Проверка структуры</strong>
              <div className="cluster">
                <Tag tone={graphValidation.errors.length > 0 ? 'accent' : 'soft'}>
                  <AlertTriangle size={14} /> Ошибок: {graphValidation.errors.length}
                </Tag>
                <Tag tone="soft">
                  <CheckCircle2 size={14} /> Сцен: {payload.nodes.length}
                </Tag>
              </div>

              {graphValidation.errors.length > 0 ? (
                <div className="stack">
                  {graphValidation.errors.map((item, index) => (
                    <div key={index} className="alert alert-error">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="notice">Критичных ошибок нет.</div>
              )}

              {graphValidation.warnings.length > 0 ? (
                <div className="stack">
                  <strong style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Предупреждения:</strong>
                  {graphValidation.warnings.map((item, index) => (
                    <div key={index} className="notice">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          </aside>

          <section className="creator-editor-canvas-column">
            <Card className="stack">
              <strong>Метаданные комикса</strong>

              <Field label="Название">
                <input
                  className="input"
                  value={payload.comicMeta.title}
                  onChange={(event) => updateMeta({ title: event.target.value })}
                />
              </Field>

              <Field label="Описание">
                <textarea
                  className="textarea"
                  rows={3}
                  value={payload.comicMeta.description}
                  onChange={(event) => updateMeta({ description: event.target.value })}
                />
              </Field>

              <div className="grid-2">
                <Field label="Жанры">
                  <div className="genre-selector">
                    <div className="genre-chips">
                      {payload.comicMeta.genres.map((g) => {
                        const opt = GENRE_OPTIONS.find((o) => o.key === g);
                        return (
                          <span key={g} className="genre-chip">
                            {opt?.label || g}
                            <button
                              type="button"
                              className="genre-chip-remove"
                              onClick={() => {
                                const next = payload.comicMeta.genres.filter((x) => x !== g);
                                updateMeta({ genres: next });
                              }}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                    <div className="genre-dropdown-wrap">
                      <select
                        className="select"
                        value=""
                        onChange={(event) => {
                          const val = event.target.value;
                          if (!val) return;
                          if (!payload.comicMeta.genres.includes(val)) {
                            updateMeta({ genres: [...payload.comicMeta.genres, val] });
                          }
                        }}
                      >
                        <option value="">Добавить жанр...</option>
                        {GENRE_OPTIONS.filter((o) => !payload.comicMeta.genres.includes(o.key)).map((o) => (
                          <option key={o.key} value={o.key}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="genre-dropdown-icon" />
                    </div>
                  </div>
                </Field>

                <Field label="Теги (через запятую)">
                  <input
                    className="input"
                    value={tagsInput}
                    onChange={(event) => {
                      const value = event.target.value;
                      setTagsInput(value);
                      updateMeta({ tags: splitByComma(value) });
                    }}
                    placeholder="выживание, выбор"
                  />
                </Field>
              </div>

              <div className="grid-2">
                <Field label="Примерная длительность (мин)">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={payload.comicMeta.estimatedMinutes}
                    onChange={(event) =>
                      updateMeta({
                        estimatedMinutes: clamp(toNumber(event.target.value, payload.comicMeta.estimatedMinutes), 1, 999),
                      })
                    }
                  />
                </Field>

                <Field label="Стартовая сцена">
                  <select
                    className="select"
                    value={payload.comicMeta.startNodeId}
                    onChange={(event) => updateMeta({ startNodeId: event.target.value })}
                  >
                    {payload.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.title || node.id}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Обложка" hint={payload.comicMeta.coverImage || 'image/*'}>
                <input className="input" type="file" accept="image/*" onChange={uploadCover} />
              </Field>
            </Card>

            <Card className="stack">
              <div className="row-between">
                <strong>{selectedNode.title || selectedNode.id}</strong>
                <label className="cluster">
                  <input
                    type="checkbox"
                    checked={selectedNode.isEnding}
                    onChange={(event) => updateNode(selectedNode.id, { isEnding: event.target.checked })}
                  />
                  Финальная сцена
                </label>
              </div>

              <div className="grid-2">
                <Field label="Название сцены">
                  <input
                    className="input"
                    value={selectedNode.title}
                    onChange={(event) => updateNode(selectedNode.id, { title: event.target.value })}
                  />
                </Field>

                <Field label="Изображение сцены" hint={selectedNode.imageUrl || 'image/*'}>
                  <input className="input" type="file" accept="image/*" onChange={uploadNodeImage} />
                </Field>
              </div>

              <div className="row-between">
                <strong>Кнопки переходов</strong>
                <Button type="button" variant="outline" size="sm" onClick={addButton} leftIcon={<Plus size={14} />}>
                  Добавить кнопку
                </Button>
              </div>

              <div className="editor-button-strip">
                {selectedNode.buttons.length === 0 ? (
                  <div className="notice">Кнопок пока нет. Добавьте минимум одну для не-финальной сцены.</div>
                ) : (
                  selectedNode.buttons.map((button, index) => (
                    <button
                      key={button.id}
                      type="button"
                      className={`editor-button-pill ${selectedButtonId === button.id ? 'active' : ''}`}
                      onClick={() => setSelectedButtonId(button.id)}
                    >
                      {index + 1}. {button.text || 'Без текста'}
                    </button>
                  ))
                )}
              </div>

            </Card>
          </section>

          <aside className="creator-editor-column">
            <Card className="stack">
              <strong>Свойства выбранной кнопки</strong>

              {selectedButton ? (
                <>
                  <Field label="Текст кнопки">
                    <input
                      className="input"
                      value={selectedButton.text}
                      onChange={(event) => updateSelectedButton({ text: event.target.value })}
                    />
                  </Field>

                  <Field label="Переход в сцену">
                    <select
                      className="select"
                      value={selectedButton.targetNodeId}
                      onChange={(event) => updateSelectedButton({ targetNodeId: event.target.value })}
                    >
                      {payload.nodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.title || node.id}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid-2">
                    <Field label="X (%)">
                      <input
                        className="input"
                        type="number"
                        value={selectedButton.x}
                        onChange={(event) => {
                          const nextX = clamp(toNumber(event.target.value, selectedButton.x), 0, 100 - selectedButton.w);
                          updateSelectedButton({ x: round(nextX) });
                        }}
                      />
                    </Field>

                    <Field label="Y (%)">
                      <input
                        className="input"
                        type="number"
                        value={selectedButton.y}
                        onChange={(event) => {
                          const nextY = clamp(toNumber(event.target.value, selectedButton.y), 0, 100 - selectedButton.h);
                          updateSelectedButton({ y: round(nextY) });
                        }}
                      />
                    </Field>

                    <Field label="Ширина (%)">
                      <input
                        className="input"
                        type="number"
                        value={selectedButton.w}
                        onChange={(event) => {
                          const nextW = clamp(toNumber(event.target.value, selectedButton.w), MIN_BUTTON_WIDTH, 100 - selectedButton.x);
                          updateSelectedButton({ w: round(nextW) });
                        }}
                      />
                    </Field>

                    <Field label="Высота (%)">
                      <input
                        className="input"
                        type="number"
                        value={selectedButton.h}
                        onChange={(event) => {
                          const nextH = clamp(toNumber(event.target.value, selectedButton.h), MIN_BUTTON_HEIGHT, 100 - selectedButton.y);
                          updateSelectedButton({ h: round(nextH) });
                        }}
                      />
                    </Field>
                  </div>

                  <div className="grid-3">
                    <Field label="Фон">
                      <input className="input color-input" type="color" value={selectedButton.bgColor} onChange={(event) => updateSelectedButton({ bgColor: event.target.value })} />
                    </Field>
                    <Field label="Текст">
                      <input className="input color-input" type="color" value={selectedButton.textColor} onChange={(event) => updateSelectedButton({ textColor: event.target.value })} />
                    </Field>
                    <Field label="Рамка">
                      <input className="input color-input" type="color" value={selectedButton.borderColor} onChange={(event) => updateSelectedButton({ borderColor: event.target.value })} />
                    </Field>
                  </div>

                  <div className="grid-2">
                    <Field label="Толщина рамки (px)">
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={24}
                        value={selectedButton.borderWidth}
                        onChange={(event) => updateSelectedButton({ borderWidth: clamp(toNumber(event.target.value, selectedButton.borderWidth), 0, 24) })}
                      />
                    </Field>

                    <Field label="Скругление (px)">
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={100}
                        value={selectedButton.radius}
                        onChange={(event) => updateSelectedButton({ radius: clamp(toNumber(event.target.value, selectedButton.radius), 0, 100) })}
                      />
                    </Field>
                  </div>

                  <div className="grid-2">
                    <Field label="Размер шрифта (px)">
                      <input
                        className="input"
                        type="number"
                        min={10}
                        max={72}
                        value={selectedButton.fontSize}
                        onChange={(event) => updateSelectedButton({ fontSize: clamp(toNumber(event.target.value, selectedButton.fontSize), 10, 72) })}
                      />
                    </Field>

                    <Field label="Насыщенность шрифта">
                      <select className="select" value={selectedButton.fontWeight} onChange={(event) => updateSelectedButton({ fontWeight: Number(event.target.value) })}>
                        {[400, 500, 600, 700, 800, 900].map((value) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid-2">
                    <Field label="Выравнивание текста">
                      <select
                        className="select"
                        value={selectedButton.textAlign}
                        onChange={(event) => updateSelectedButton({ textAlign: event.target.value as HotspotButton['textAlign'] })}
                      >
                        <option value="left">Слева</option>
                        <option value="center">По центру</option>
                        <option value="right">Справа</option>
                      </select>
                    </Field>

                    <Field label="Прозрачность">
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={selectedButton.opacity}
                        onChange={(event) => updateSelectedButton({ opacity: clamp(toNumber(event.target.value, selectedButton.opacity), 0, 1) })}
                      />
                    </Field>
                  </div>

                  <label className="cluster">
                    <input type="checkbox" checked={selectedButton.visible} onChange={(event) => updateSelectedButton({ visible: event.target.checked })} />
                    Показывать кнопку в сцене
                  </label>

                  <div className="cluster">
                    <Button type="button" variant="danger" size="sm" onClick={() => removeButton(selectedButton.id)} leftIcon={<Trash2 size={14} />}>
                      Удалить кнопку
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateSelectedButton({
                          ...createButton(payload.nodes[0]?.id || selectedNode.id),
                          id: selectedButton.id,
                          text: selectedButton.text,
                          targetNodeId: selectedButton.targetNodeId,
                        })
                      }
                      leftIcon={<RotateCcw size={14} />}
                    >
                      Сбросить стиль
                    </Button>
                  </div>
                </>
              ) : (
                <div className="notice">Нажмите на кнопку в рабочей области или в списке, чтобы открыть её настройки.</div>
              )}
            </Card>

            <Card className="stack">
              <div className="row-between">
                <strong>Предпросмотр перед модерацией</strong>
                <Tag tone="soft"><Eye size={14} /> Интерактив</Tag>
              </div>

              <div className="cluster">
                <Button size="sm" variant="outline" onClick={startPreview}>Запустить с начала</Button>
                <Button size="sm" variant="ghost" onClick={previewBack} disabled={previewHistory.length === 0}>Назад по выбору</Button>
              </div>

              <div className="field-hint">Текущий путь: {previewTrail || 'Стартовая сцена'}</div>

              {previewNode?.isEnding ? (
                <div className="alert alert-success">
                  <strong>Финал:</strong> {previewNode.title || previewNode.id}
                  <Button size="sm" variant="outline" onClick={startPreview} style={{ marginTop: '0.5rem' }}>Начать заново</Button>
                </div>
              ) : null}

              <div className="editor-preview-scroll">
                <div className="editor-preview-scale-box" style={{ width: `${WORKSPACE_WIDTH * PREVIEW_SCALE}px`, height: `${WORKSPACE_HEIGHT * PREVIEW_SCALE}px` }}>
                  <div
                    className="editor-workspace editor-workspace-preview"
                    style={{
                      width: `${WORKSPACE_WIDTH}px`,
                      height: `${WORKSPACE_HEIGHT}px`,
                      transform: `scale(${PREVIEW_SCALE})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <div className="studio-grid-overlay" />

                    <div
                      className="editor-workspace-image-frame"
                      style={{
                        left: `${IMAGE_FRAME_PERCENT.x}%`,
                        top: `${IMAGE_FRAME_PERCENT.y}%`,
                        width: `${IMAGE_FRAME_PERCENT.w}%`,
                        height: `${IMAGE_FRAME_PERCENT.h}%`,
                      }}
                    >
                      {previewNode?.imageUrl ? (
                        <img src={previewNode.imageUrl} alt={previewNode.title || previewNode.id} className="editor-workspace-image" />
                      ) : (
                        <div className="editor-workspace-empty"><strong>Нет изображения</strong></div>
                      )}
                    </div>

                    {(previewNode?.buttons || []).map((button) => (
                      <button
                        key={button.id}
                        type="button"
                        className="canvas-choice editor-hotspot preview"
                        style={{
                          left: `${button.x}%`,
                          top: `${button.y}%`,
                          width: `${button.w}%`,
                          height: `${button.h}%`,
                          background: button.bgColor,
                          color: button.textColor,
                          borderColor: button.borderColor,
                          borderWidth: `${button.borderWidth}px`,
                          borderStyle: 'solid',
                          opacity: button.opacity,
                          borderRadius: `${button.radius}px`,
                          fontSize: `${button.fontSize}px`,
                          fontWeight: button.fontWeight,
                          textAlign: button.textAlign,
                          display: button.visible ? 'flex' : 'none',
                        }}
                        onClick={() => goToPreviewNode(button.targetNodeId)}
                      >
                        <span className="editor-hotspot-label">{button.text || 'Без текста'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        <Card className="stack editor-workspace-fullwidth">
          <div ref={scrollContainerRefCb} className="editor-workspace-scroll">
            <div className="editor-workspace-scale-box" style={{ width: `${WORKSPACE_WIDTH * editorScale}px`, height: `${WORKSPACE_HEIGHT * editorScale}px` }}>
              <div
                ref={workspaceRef}
                className="editor-workspace"
                style={{ width: `${WORKSPACE_WIDTH}px`, height: `${WORKSPACE_HEIGHT}px`, transform: `scale(${editorScale})`, transformOrigin: 'top left' }}
                onPointerDown={() => setSelectedButtonId(null)}
              >
                <div className="studio-grid-overlay" />

                <div
                  className="editor-workspace-image-frame"
                  style={{
                    left: `${IMAGE_FRAME_PERCENT.x}%`,
                    top: `${IMAGE_FRAME_PERCENT.y}%`,
                    width: `${IMAGE_FRAME_PERCENT.w}%`,
                    height: `${IMAGE_FRAME_PERCENT.h}%`,
                  }}
                >
                  {selectedNode.imageUrl ? (
                    <img src={selectedNode.imageUrl} alt={selectedNode.title || selectedNode.id} className="editor-workspace-image" />
                  ) : (
                    <div className="editor-workspace-empty">
                      <strong>Нет изображения сцены</strong>
                      <span>Загрузите PNG/JPG, чтобы проверить позиционирование кнопок на кадре.</span>
                    </div>
                  )}
                  <span className="editor-workspace-image-badge">Область кадра</span>
                </div>

                {selectedNode.buttons.map((button) => (
                  <button
                    key={button.id}
                    type="button"
                    className={`canvas-choice editor-hotspot ${selectedButtonId === button.id ? 'active' : ''}`}
                    style={{
                      left: `${button.x}%`,
                      top: `${button.y}%`,
                      width: `${button.w}%`,
                      height: `${button.h}%`,
                      background: button.bgColor,
                      color: button.textColor,
                      borderColor: button.borderColor,
                      borderWidth: `${button.borderWidth}px`,
                      borderStyle: 'solid',
                      opacity: button.opacity,
                      borderRadius: `${button.radius}px`,
                      fontSize: `${button.fontSize}px`,
                      fontWeight: button.fontWeight,
                      textAlign: button.textAlign,
                      display: button.visible ? 'flex' : 'none',
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedButtonId(button.id);
                    }}
                    onPointerDown={(event) => beginButtonDrag(event, button, 'move')}
                  >
                    <span className="editor-hotspot-label">{button.text || 'Без текста'}</span>
                    <span
                      className="resize-handle editor-hotspot-handle"
                      onPointerDown={(event) => beginButtonDrag(event, button, 'resize')}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
