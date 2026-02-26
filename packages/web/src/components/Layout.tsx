import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Outlet } from 'react-router-dom';
import {
  Download,
  PenSquare,
  Shield,
  UserCog,
  Users,
  User,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWorkRailStore } from '../store/workRailStore';
import { TopNav } from './ui/TopNav';
import { WorkRail } from './ui/WorkRail';

const MOBILE_WORK_RAIL_BREAKPOINT = 900;
const WORK_RAIL_EDGE_GAP = 4;
const DEFAULT_WORK_RAIL_WIDTH = 260;
const DEFAULT_WORK_RAIL_HEIGHT = 420;
const MIN_WORK_RAIL_WIDTH = 220;
const MIN_WORK_RAIL_HEIGHT = 220;
const MAX_WORK_RAIL_WIDTH = 560;
const MAX_WORK_RAIL_HEIGHT = 760;
const WORK_RAIL_RESIZE_STEP_X = 36;
const WORK_RAIL_RESIZE_STEP_Y = 56;

const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');

const workLinks = [
  { to: '/profile', label: 'Профиль', icon: User, roles: ['reader', 'creator', 'admin'] as const },
  ...(!isElectron ? [{ to: '/downloads', label: 'Скачать', icon: Download, roles: ['reader', 'creator', 'admin'] as const }] : []),
  { to: '/creator/studio', label: 'Студия', icon: PenSquare, roles: ['creator', 'admin'] as const },
  { to: '/admin/creator-requests', label: 'Заявки', icon: UserCog, roles: ['admin'] as const },
  { to: '/admin/reviews', label: 'Ревью', icon: Shield, roles: ['admin'] as const },
  { to: '/admin/comments', label: 'Жалобы', icon: Shield, roles: ['admin'] as const },
  { to: '/admin/comics', label: 'Комиксы', icon: BookOpen, roles: ['admin'] as const },
  { to: '/admin/users', label: 'Пользователи', icon: Users, roles: ['admin'] as const },
];

export default function Layout() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    visible: isWorkRailVisible,
    position: workRailPosition,
    size: workRailSize,
    initializedViewport,
    setVisible: setWorkRailVisible,
    setPosition: setWorkRailPosition,
    setSize: setWorkRailSize,
    setInitializedViewport,
  } = useWorkRailStore();

  const [isMobileWorkRail, setIsMobileWorkRail] = useState<boolean>(
    () => (typeof window !== 'undefined' ? window.innerWidth < MOBILE_WORK_RAIL_BREAKPOINT : false)
  );

  const canUseWorkRail = isAuthenticated && Boolean(user) && user?.role !== 'reader';

  useEffect(() => {
    if (canUseWorkRail && !isWorkRailVisible) {
      setWorkRailVisible(true);
    }
    if (!canUseWorkRail && isWorkRailVisible) {
      setWorkRailVisible(false);
    }
  }, [canUseWorkRail, isWorkRailVisible, setWorkRailVisible]);

  const [isDraggingWorkRail, setIsDraggingWorkRail] = useState(false);

  const workRailRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);

  const availableWorkLinks = useMemo(() => {
    if (!user) return [];
    return workLinks.filter((link) => link.roles.includes(user.role as any));
  }, [user]);

  const getWorkRailHeaderOffset = useCallback(() => {
    return 80;
  }, []);

  const clampWorkRailSize = useCallback((size: { width: number; height: number }) => {
    return {
      width: Math.min(Math.max(Math.round(size.width), MIN_WORK_RAIL_WIDTH), MAX_WORK_RAIL_WIDTH),
      height: Math.min(Math.max(Math.round(size.height), MIN_WORK_RAIL_HEIGHT), MAX_WORK_RAIL_HEIGHT),
    };
  }, []);

  const clampWorkRailPosition = useCallback(
    (position: { x: number; y: number }, sizeOverride?: { width: number; height: number }) => {
      const sourceSize = sizeOverride || {
        width: workRailRef.current?.offsetWidth ?? workRailSize.width ?? DEFAULT_WORK_RAIL_WIDTH,
        height: workRailRef.current?.offsetHeight ?? workRailSize.height ?? DEFAULT_WORK_RAIL_HEIGHT,
      };
      const panelSize = clampWorkRailSize(sourceSize);
      const panelWidth = panelSize.width;
      const panelHeight = panelSize.height;

      const minX = WORK_RAIL_EDGE_GAP;
      const minY = getWorkRailHeaderOffset();

      const maxX = Math.max(minX, window.innerWidth - panelWidth - WORK_RAIL_EDGE_GAP);
      const maxY = Math.max(minY, window.innerHeight - panelHeight - WORK_RAIL_EDGE_GAP);

      return {
        x: Math.min(Math.max(position.x, minX), maxX),
        y: Math.min(Math.max(position.y, minY), maxY),
      };
    },
    [clampWorkRailSize, getWorkRailHeaderOffset, workRailSize.height, workRailSize.width]
  );

  useEffect(() => {
    const updateViewportState = () => {
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      const mobileMode = viewport.w < MOBILE_WORK_RAIL_BREAKPOINT;
      setIsMobileWorkRail(mobileMode);

      if (!canUseWorkRail) {
        return;
      }

      const nextSize = clampWorkRailSize(workRailSize);
      if (nextSize.width !== workRailSize.width || nextSize.height !== workRailSize.height) {
        setWorkRailSize(nextSize);
      }

      if (mobileMode) {
        if (initializedViewport.w !== viewport.w || initializedViewport.h !== viewport.h) {
          setInitializedViewport(viewport);
        }
        return;
      }

      let nextPosition = workRailPosition;

      if (
        initializedViewport.w > 0 &&
        initializedViewport.h > 0 &&
        (initializedViewport.w !== viewport.w || initializedViewport.h !== viewport.h)
      ) {
        const ratioX = viewport.w / initializedViewport.w;
        const ratioY = viewport.h / initializedViewport.h;
        nextPosition = {
          x: Math.round(workRailPosition.x * ratioX),
          y: Math.round(workRailPosition.y * ratioY),
        };
      }

      const clamped = clampWorkRailPosition(nextPosition, nextSize);
      if (clamped.x !== workRailPosition.x || clamped.y !== workRailPosition.y) {
        setWorkRailPosition(clamped);
      }

      if (initializedViewport.w !== viewport.w || initializedViewport.h !== viewport.h) {
        setInitializedViewport(viewport);
      }
    };

    updateViewportState();
    window.addEventListener('resize', updateViewportState);
    return () => window.removeEventListener('resize', updateViewportState);
  }, [
    canUseWorkRail,
    clampWorkRailSize,
    clampWorkRailPosition,
    initializedViewport.h,
    initializedViewport.w,
    setInitializedViewport,
    setWorkRailSize,
    setWorkRailPosition,
    workRailPosition.x,
    workRailPosition.y,
    workRailSize.height,
    workRailSize.width,
  ]);

  useEffect(() => {
    if (!canUseWorkRail || isMobileWorkRail || !isWorkRailVisible) {
      return;
    }

    const panel = workRailRef.current;
    if (!panel || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextSize = clampWorkRailSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });

      if (
        Math.abs(nextSize.width - workRailSize.width) > 1 ||
        Math.abs(nextSize.height - workRailSize.height) > 1
      ) {
        setWorkRailSize(nextSize);
      }

      const clampedPosition = clampWorkRailPosition(workRailPosition, nextSize);
      if (
        clampedPosition.x !== workRailPosition.x ||
        clampedPosition.y !== workRailPosition.y
      ) {
        setWorkRailPosition(clampedPosition);
      }
    });

    observer.observe(panel);
    return () => observer.disconnect();
  }, [
    canUseWorkRail,
    clampWorkRailSize,
    clampWorkRailPosition,
    isMobileWorkRail,
    isWorkRailVisible,
    setWorkRailPosition,
    setWorkRailSize,
    workRailPosition.x,
    workRailPosition.y,
    workRailSize.height,
    workRailSize.width,
  ]);

  useEffect(() => {
    const stopDragging = (event?: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;
      if (event && dragState.pointerId !== event.pointerId) return;

      if (pendingPositionRef.current) {
        setWorkRailPosition(clampWorkRailPosition(pendingPositionRef.current));
      }

      dragStateRef.current = null;
      pendingPositionRef.current = null;
      didDragRef.current = false;
      setIsDraggingWorkRail(false);
      document.body.style.userSelect = '';

      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (isMobileWorkRail || !isWorkRailVisible) return;
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      pendingPositionRef.current = clampWorkRailPosition({
        x: event.clientX - dragState.offsetX,
        y: event.clientY - dragState.offsetY,
      });

      didDragRef.current = true;

      if (dragFrameRef.current !== null) {
        return;
      }

      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null;
        if (pendingPositionRef.current) {
          setWorkRailPosition(pendingPositionRef.current);
        }
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      stopDragging();
    };
  }, [clampWorkRailPosition, isMobileWorkRail, isWorkRailVisible, setWorkRailPosition]);

  const handleWorkRailPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMobileWorkRail || !isWorkRailVisible) {
      return;
    }
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - workRailPosition.x,
      offsetY: event.clientY - workRailPosition.y,
    };
    didDragRef.current = false;
    setIsDraggingWorkRail(true);
    document.body.style.userSelect = 'none';
    event.preventDefault();
  };

  const applyWorkRailSize = useCallback((size: { width: number; height: number }) => {
    const clampedSize = clampWorkRailSize(size);
    setWorkRailSize(clampedSize);
    const clampedPosition = clampWorkRailPosition(workRailPosition, clampedSize);
    if (
      clampedPosition.x !== workRailPosition.x ||
      clampedPosition.y !== workRailPosition.y
    ) {
      setWorkRailPosition(clampedPosition);
    }
  }, [clampWorkRailPosition, clampWorkRailSize, setWorkRailPosition, setWorkRailSize, workRailPosition]);

  const handleResizeDown = useCallback(() => {
    applyWorkRailSize({
      width: workRailSize.width - WORK_RAIL_RESIZE_STEP_X,
      height: workRailSize.height - WORK_RAIL_RESIZE_STEP_Y,
    });
  }, [applyWorkRailSize, workRailSize.height, workRailSize.width]);

  const handleResizeUp = useCallback(() => {
    applyWorkRailSize({
      width: workRailSize.width + WORK_RAIL_RESIZE_STEP_X,
      height: workRailSize.height + WORK_RAIL_RESIZE_STEP_Y,
    });
  }, [applyWorkRailSize, workRailSize.height, workRailSize.width]);

  const handleResizeReset = useCallback(() => {
    applyWorkRailSize({
      width: DEFAULT_WORK_RAIL_WIDTH,
      height: DEFAULT_WORK_RAIL_HEIGHT,
    });
  }, [applyWorkRailSize]);

  const isWorkShell = canUseWorkRail;

  return (
    <div className="app-shell">
      <TopNav />

      <div className={`main-shell ${isWorkShell ? 'work-shell' : 'public-shell'}`}>
        <main>
          <Outlet />
        </main>

        {canUseWorkRail && isWorkRailVisible && (
          <aside
            ref={workRailRef}
            className={`work-rail ${isMobileWorkRail ? 'mobile' : ''} ${isDraggingWorkRail ? 'dragging' : ''}`}
            style={
              isMobileWorkRail
                ? undefined
                : {
                      left: `${workRailPosition.x}px`,
                      top: `${workRailPosition.y}px`,
                      width: `${workRailSize.width}px`,
                      height: `${workRailSize.height}px`,
                    }
            }
            aria-label="Рабочая зона"
          >
            <WorkRail
              items={availableWorkLinks}
              onHeaderPointerDown={handleWorkRailPointerDown}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
