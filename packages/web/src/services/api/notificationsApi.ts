import api from './client';

export const notificationsApi = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get('/notifications', { params }),

  getUnreadCount: () =>
    api.get('/notifications/unread-count'),

  markRead: (id: string) =>
    api.post(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post('/notifications/read-all'),

  remove: (id: string) =>
    api.delete(`/notifications/${id}`),

  removeAll: () =>
    api.delete('/notifications'),
};
