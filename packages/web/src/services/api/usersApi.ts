import api from './client';

export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: {
    displayName?: string;
    bio?: string;
    creatorNick?: string;
    avatarFileId?: string;
  }) => api.put('/users/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getStats: () => api.get('/users/stats'),
  getCreatorRequest: () => api.get('/users/creator-request'),
  createCreatorRequest: (data: { desiredNick: string; motivation?: string }) =>
    api.post('/users/creator-request', data),
  addFavorite: (comicId: string) => api.post(`/users/favorites/${comicId}`),
  removeFavorite: (comicId: string) => api.delete(`/users/favorites/${comicId}`),
};
