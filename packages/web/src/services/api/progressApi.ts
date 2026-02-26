import api from './client';

export const progressApi = {
  getAll: () => api.get('/progress'),
  get: (comicId: string) => api.get(`/progress/${comicId}`),
  start: (comicId: string) => api.post(`/progress/${comicId}/start`),
  recordChoice: (
    comicId: string,
    data: {
      pageId: string;
      choiceId: string;
      targetPageId: string;
      timeSpentSeconds?: number;
    }
  ) => api.post(`/progress/${comicId}/choice`, data),
  recordEnding: (
    comicId: string,
    data: {
      endingPageId: string;
      endingType: string;
    }
  ) => api.post(`/progress/${comicId}/ending`, data),
  reset: (comicId: string) => api.delete(`/progress/${comicId}`),
  sync: (comicId: string, data: any) => api.put(`/progress/${comicId}/sync`, data),
};
