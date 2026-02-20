import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync('accessToken');
  },
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('accessToken', token);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync('refreshToken');
  },
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('refreshToken', token);
  },
  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },
};

api.interceptors.request.use(
  async (config) => {
    const token = await TokenStorage.getAccessToken();
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { tokens } = response.data.data;
          await TokenStorage.setAccessToken(tokens.accessToken);
          await TokenStorage.setRefreshToken(tokens.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        await TokenStorage.clearTokens();
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; confirmPassword: string }) =>
    api.post('/auth/register', data),
  
  me: () => api.get('/auth/me'),
};

export const comicsApi = {
  getAll: (params?: any) => api.get('/comics', { params }),
  getFeatured: () => api.get('/comics/featured'),
  getById: (id: string) => api.get(`/comics/${id}`),
  getPages: (id: string) => api.get(`/comics/${id}/pages`),
};

export const progressApi = {
  getAll: () => api.get('/progress'),
  get: (comicId: string) => api.get(`/progress/${comicId}`),
  recordChoice: (comicId: string, data: any) => api.post(`/progress/${comicId}/choice`, data),
  recordEnding: (comicId: string, data: any) => api.post(`/progress/${comicId}/ending`, data),
};

export default api;
