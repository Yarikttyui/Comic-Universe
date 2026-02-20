import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().tokens?.refreshToken;
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { tokens } = response.data.data;
          useAuthStore.getState().setTokens(tokens);
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        await useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; nick: string; password: string; confirmPassword: string }) =>
    api.post('/auth/register', data),
  setOnboardingRole: (role: 'reader' | 'creator') => api.post('/auth/onboarding/role', { role }),
  completeCreatorProfile: (data: { creatorNick: string; avatarFileId: string }) =>
    api.post('/auth/onboarding/creator-profile', data),
  completeReaderOnboarding: () => api.post('/auth/onboarding/reader-complete'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken?: string) => api.post('/auth/logout', { refreshToken }),
};

export const uploadsApi = {
  uploadFile: (file: File, context?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (context) formData.append('context', context);
    return api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

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

export const adminApi = {
  getRevisions: (status = 'pending_review') => api.get('/admin/revisions', { params: { status } }),
  getRevision: (revisionId: string) => api.get(`/admin/revisions/${revisionId}`),
  approveRevision: (revisionId: string) => api.post(`/admin/revisions/${revisionId}/approve`),
  rejectRevision: (revisionId: string, reason: string) =>
    api.post(`/admin/revisions/${revisionId}/reject`, { reason }),
  getCreatorRequests: (status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'all' = 'pending') =>
    api.get('/admin/creator-requests', { params: { status } }),
  approveCreatorRequest: (requestId: string, comment?: string) =>
    api.post(`/admin/creator-requests/${requestId}/approve`, { comment }),
  rejectCreatorRequest: (requestId: string, reason: string) =>
    api.post(`/admin/creator-requests/${requestId}/reject`, { reason }),
  getCommentReports: (status = 'open') => api.get('/admin/comment-reports', { params: { status } }),
  hideComment: (commentId: string) => api.post(`/admin/comments/${commentId}/hide`),
  restoreComment: (commentId: string) => api.post(`/admin/comments/${commentId}/restore`),
  deleteComment: (commentId: string) => api.delete(`/admin/comments/${commentId}`),
  getComics: (status = 'all') => api.get('/admin/comics', { params: { status } }),
  hideComic: (comicId: string) => api.post(`/admin/comics/${comicId}/hide`),
  unhideComic: (comicId: string) => api.post(`/admin/comics/${comicId}/unhide`),
  getComicReports: (status = 'open') => api.get('/admin/comic-reports', { params: { status } }),
  resolveComicReport: (reportId: string) => api.post(`/admin/comic-reports/${reportId}/resolve`),
};

export const creatorsApi = {
  getByCreatorNick: (creatorNick: string) => api.get(`/creators/${creatorNick}`),
};

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

export default api;
