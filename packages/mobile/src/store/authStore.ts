import { create } from 'zustand';
import { authApi, TokenStorage } from '../services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: string;
  creatorNick?: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; nick: string; password: string; confirmPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(email, password);
      const { user, tokens } = response.data.data;
      
      await TokenStorage.setAccessToken(tokens.accessToken);
      await TokenStorage.setRefreshToken(tokens.refreshToken);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(data);
      const { user, tokens } = response.data.data;
      
      await TokenStorage.setAccessToken(tokens.accessToken);
      await TokenStorage.setRefreshToken(tokens.refreshToken);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await TokenStorage.clearTokens();
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = await TokenStorage.getAccessToken();
    if (!token) return;

    try {
      const response = await authApi.me();
      set({
        user: response.data.data.user,
        isAuthenticated: true,
      });
    } catch {
      await TokenStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },
}));
