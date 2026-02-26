import { create } from 'zustand';
import { notificationsApi } from '../services/api';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  payload?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  socketConnected: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  initSocket: () => void;
  destroySocket: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  socketConnected: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsApi.getAll({ limit: 30, offset: 0 });
      set({
        notifications: res.data.data.notifications || [],
        unreadCount: res.data.data.unreadCount ?? 0,
      });
    } catch {
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      set({ unreadCount: res.data.data.unreadCount ?? 0 });
    } catch {
    }
  },

  markRead: async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch {
    }
  },

  markAllRead: async () => {
    try {
      await notificationsApi.markAllRead();
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
    }
  },

  removeNotification: async (id: string) => {
    try {
      await notificationsApi.remove(id);
      set((s) => {
        const removed = s.notifications.find((n) => n.id === id);
        return {
          notifications: s.notifications.filter((n) => n.id !== id),
          unreadCount: removed && !removed.isRead ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
        };
      });
    } catch {
    }
  },

  clearAll: async () => {
    try {
      await notificationsApi.removeAll();
      set({ notifications: [], unreadCount: 0 });
    } catch {
    }
  },

  initSocket: () => {
    const sock = connectSocket();
    if (!sock) return;

    sock.on('connect', () => {
      set({ socketConnected: true });
    });

    sock.on('disconnect', () => {
      set({ socketConnected: false });
    });

    sock.on('notification:new', (notification: AppNotification) => {
      set((s) => ({
        notifications: [notification, ...s.notifications].slice(0, 50),
        unreadCount: s.unreadCount + 1,
      }));
    });

    get().fetchNotifications();
  },

  destroySocket: () => {
    const sock = getSocket();
    if (sock) {
      sock.off('notification:new');
      sock.off('connect');
      sock.off('disconnect');
    }
    disconnectSocket();
    set({ socketConnected: false, notifications: [], unreadCount: 0 });
  },
}));
