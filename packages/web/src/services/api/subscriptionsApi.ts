import api from './client';

export const subscriptionsApi = {
  getMy: () =>
    api.get('/subscriptions/my'),

  subscribe: (authorId: string) =>
    api.post(`/subscriptions/${authorId}`),

  unsubscribe: (authorId: string) =>
    api.delete(`/subscriptions/${authorId}`),

  check: (authorId: string) =>
    api.get(`/subscriptions/check/${authorId}`),

  getCount: (authorId: string) =>
    api.get(`/subscriptions/count/${authorId}`),
};
