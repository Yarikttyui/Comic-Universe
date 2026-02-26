import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';

export type UserRole = 'reader' | 'creator' | 'admin';
export type OnboardingStage = 'role_select' | 'creator_profile' | 'done';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string | null;
  role: UserRole;
  creatorNick?: string | null;
  onboardingStage: OnboardingStage;
  isOnboardingCompleted: boolean;
  nextAction: 'select_role' | 'complete_creator_profile' | null;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterPayload {
  email: string;
  nick: string;
  password: string;
  confirmPassword: string;
}

interface AuthState {
  user: AuthUser | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingVerificationEmail: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  completeRoleSelection: (role: 'reader' | 'creator') => Promise<void>;
  completeCreatorProfile: (data: { creatorNick: string; avatarFileId: string }) => Promise<void>;
  completeReaderOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setTokens: (tokens: Tokens) => void;
  setPendingVerificationEmail: (email: string | null) => void;
}

const mapRole = (role: string): UserRole => {
  if (role === 'author') return 'creator';
  if (role === 'admin') return 'admin';
  if (role === 'creator') return 'creator';
  return 'reader';
};

const normalizeUser = (raw: any): AuthUser => ({
  id: raw.id,
  email: raw.email,
  displayName: raw.displayName,
  avatar: raw.avatar,
  role: mapRole(raw.role),
  creatorNick: raw.creatorNick ?? null,
  onboardingStage: (raw.onboardingStage || 'done') as OnboardingStage,
  isOnboardingCompleted: raw.isOnboardingCompleted ?? raw.onboardingStage === 'done',
  nextAction: raw.nextAction ?? null,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
      pendingVerificationEmail: null,

      setPendingVerificationEmail: (email) => set({ pendingVerificationEmail: email }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const data = response.data.data;
          if (data.needsVerification) {
            set({ isLoading: false, pendingVerificationEmail: data.email });
            throw { needsVerification: true, email: data.email };
          }
          const { user, tokens } = data;
          set({
            user: normalizeUser(user),
            tokens,
            isAuthenticated: true,
            isLoading: false,
            pendingVerificationEmail: null,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const resData = response.data.data;
          if (resData.needsVerification) {
            set({ isLoading: false, pendingVerificationEmail: resData.email });
            return;
          }
          const { user, tokens } = resData;
          set({
            user: normalizeUser(user),
            tokens,
            isAuthenticated: true,
            isLoading: false,
            pendingVerificationEmail: null,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      verifyEmail: async (email, code) => {
        set({ isLoading: true });
        try {
          const response = await authApi.verifyEmail(email, code);
          const { user, tokens } = response.data.data;
          set({
            user: normalizeUser(user),
            tokens,
            isAuthenticated: true,
            isLoading: false,
            pendingVerificationEmail: null,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      completeRoleSelection: async (role) => {
        const response = await authApi.setOnboardingRole(role);
        const { user } = response.data.data;
        set({ user: normalizeUser(user) });
      },

      completeCreatorProfile: async ({ creatorNick, avatarFileId }) => {
        const response = await authApi.completeCreatorProfile({ creatorNick, avatarFileId });
        const { user } = response.data.data;
        set({ user: normalizeUser(user) });
      },

      completeReaderOnboarding: async () => {
        const response = await authApi.completeReaderOnboarding();
        const { user } = response.data.data;
        set({ user: normalizeUser(user) });
      },

      logout: async () => {
        const refreshToken = get().tokens?.refreshToken;
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch {
        }

        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await authApi.me();
          set({
            user: normalizeUser(response.data.data.user),
            isAuthenticated: true,
          });
        } catch {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
          });
        }
      },

      setTokens: (tokens) => set({ tokens }),
    }),
    {
      name: 'comic-universe-auth',
      partialize: (state) => ({ tokens: state.tokens }),
    }
  )
);
