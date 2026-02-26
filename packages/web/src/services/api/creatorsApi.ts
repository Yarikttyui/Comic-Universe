import api from './client';

export const creatorsApi = {
  getByCreatorNick: (creatorNick: string) => api.get(`/creators/${creatorNick}`),
};
