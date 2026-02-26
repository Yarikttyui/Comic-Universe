import api from './client';

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; nick: string; password: string; confirmPassword: string }) =>
    api.post('/auth/register', data),
  verifyEmail: (email: string, code: string) => api.post('/auth/verify-email', { email, code }),
  resendCode: (email: string) => api.post('/auth/resend-code', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; newPassword: string; confirmPassword: string }) =>
    api.post('/auth/reset-password', data),
  setOnboardingRole: (role: 'reader' | 'creator') => api.post('/auth/onboarding/role', { role }),
  completeCreatorProfile: (data: { creatorNick: string; avatarFileId: string }) =>
    api.post('/auth/onboarding/creator-profile', data),
  completeReaderOnboarding: () => api.post('/auth/onboarding/reader-complete'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken?: string) => api.post('/auth/logout', { refreshToken }),
};
