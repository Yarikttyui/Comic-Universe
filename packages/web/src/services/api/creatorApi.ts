import api from './client';

export const creatorApi = {
  getMyComics: () => api.get('/creator/comics'),
  createComic: (data: {
    title: string;
    description: string;
    coverFileId?: string;
    genres?: string[];
    tags?: string[];
    estimatedMinutes?: number;
  }) => api.post('/creator/comics', data),
  getDraft: (comicId: string) => api.get(`/creator/comics/${comicId}/draft`),
  saveDraft: (comicId: string, payload: any) => api.put(`/creator/comics/${comicId}/draft`, { payload }),
  submitComic: (comicId: string) => api.post(`/creator/comics/${comicId}/submit`),
  deleteComic: (comicId: string) => api.delete(`/creator/comics/${comicId}`),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/creator/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
