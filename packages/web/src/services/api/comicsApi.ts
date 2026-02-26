import api from './client';

export const comicsApi = {
  getStats: () => api.get('/comics/stats'),
  getAll: (params?: {
    page?: number;
    limit?: number;
    genres?: string;
    size?: string;
    search?: string;
  }) => api.get('/comics', { params }),
  getFeatured: () => api.get('/comics/featured'),
  getById: (id: string) => api.get(`/comics/${id}`),
  getPages: (id: string) => api.get(`/comics/${id}/pages`),
  getPage: (comicId: string, pageId: string) => api.get(`/comics/${comicId}/page/${pageId}`),
  rate: (id: string, rating: number) => api.post(`/comics/${id}/rate`, { rating }),
  getComments: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/comics/${id}/comments`, { params }),
  addComment: (id: string, body: string) => api.post(`/comics/${id}/comments`, { body }),
  deleteComment: (id: string, commentId: string) => api.delete(`/comics/${id}/comments/${commentId}`),
  reportComment: (id: string, commentId: string, reason: string) =>
    api.post(`/comics/${id}/comments/${commentId}/report`, { reason }),
  reportComic: (id: string, reason: string) =>
    api.post(`/comics/${id}/report`, { reason }),
};
