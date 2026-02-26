export type UserRole = 'reader' | 'creator' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  creatorNick?: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  bio?: string;
  favoriteComics: string[];
  readingHistory: ReadingHistoryItem[];
  achievements: Achievement[];
  stats: UserStats;
}

export interface ReadingHistoryItem {
  comicId: string;
  lastPageId: string;
  progress: number;
  startedAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface UserStats {
  comicsRead: number;
  totalChoicesMade: number;
  endingsUnlocked: number;
  readingTimeMinutes: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
