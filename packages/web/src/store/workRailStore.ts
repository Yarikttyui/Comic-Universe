import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkRailPosition {
  x: number;
  y: number;
}

interface WorkRailViewport {
  w: number;
  h: number;
}

interface WorkRailSize {
  width: number;
  height: number;
}

interface WorkRailState {
  visible: boolean;
  collapsed: boolean;
  position: WorkRailPosition;
  size: WorkRailSize;
  initializedViewport: WorkRailViewport;
  setVisible: (visible: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  setPosition: (position: WorkRailPosition) => void;
  setSize: (size: WorkRailSize) => void;
  setInitializedViewport: (viewport: WorkRailViewport) => void;
}

const DEFAULT_POSITION: WorkRailPosition = {
  x: 16,
  y: 104,
};

const DEFAULT_VIEWPORT: WorkRailViewport = {
  w: 0,
  h: 0,
};

const DEFAULT_SIZE: WorkRailSize = {
  width: 260,
  height: 420,
};

export const useWorkRailStore = create<WorkRailState>()(
  persist(
    (set) => ({
      visible: true,
      collapsed: false,
      position: DEFAULT_POSITION,
      size: DEFAULT_SIZE,
      initializedViewport: DEFAULT_VIEWPORT,
      setVisible: (visible) => set({ visible }),
      setCollapsed: (collapsed) => set({ collapsed }),
      setPosition: (position) => set({ position }),
      setSize: (size) => set({ size }),
      setInitializedViewport: (initializedViewport) => set({ initializedViewport }),
    }),
    {
      name: 'comic-universe-work-rail',
      version: 2,
      migrate: () => ({
        visible: true,
        collapsed: false,
        position: DEFAULT_POSITION,
        size: DEFAULT_SIZE,
        initializedViewport: DEFAULT_VIEWPORT,
      }),
    }
  )
);
