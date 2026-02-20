import { create } from 'zustand';
import { comicsApi, progressApi } from '../services/api';
import { useAuthStore } from './authStore';

export interface Comic {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorName: string;
  authorCreatorNick?: string | null;
  genres: string[];
  size: 'small' | 'medium' | 'large';
  status?: string;
  rating: number;
  ratingCount: number;
  readCount: number;
  estimatedMinutes: number;
  totalPages: number;
  totalEndings: number;
  startPageId: string;
}

export interface ComicPage {
  pageId: string;
  pageNumber: number;
  title?: string;
  panels: any[];
  choices: any[];
  isEnding: boolean;
  endingType?: string;
  endingTitle?: string;
}

interface ComicsState {
  comics: Comic[];
  featuredComics: Comic[];
  currentComic: Comic | null;
  pages: ComicPage[];
  currentPage: ComicPage | null;
  isLoading: boolean;
  error: string | null;

  fetchComics: (params?: any) => Promise<void>;
  fetchFeatured: () => Promise<void>;
  fetchComic: (id: string) => Promise<void>;
  fetchPages: (id: string) => Promise<void>;
  setCurrentPage: (pageId: string) => void;
  makeChoice: (choiceId: string, targetPageId: string) => void;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeComic = (raw: any): Comic => ({
  id: raw?._id || raw?.id,
  title: raw?.title || '',
  description: raw?.description || '',
  coverImage: raw?.coverImage || '',
  authorName: raw?.authorName || '',
  authorCreatorNick: raw?.authorCreatorNick ?? null,
  genres: Array.isArray(raw?.genres) ? raw.genres : [],
  size: (raw?.size || 'small') as Comic['size'],
  status: raw?.status,
  rating: toNumber(raw?.rating, 0),
  ratingCount: toNumber(raw?.ratingCount, 0),
  readCount: toNumber(raw?.readCount, 0),
  estimatedMinutes: toNumber(raw?.estimatedMinutes, 0),
  totalPages: toNumber(raw?.totalPages, 0),
  totalEndings: toNumber(raw?.totalEndings, 0),
  startPageId: raw?.startPageId || 'page-1',
});

export const useComicsStore = create<ComicsState>((set, get) => ({
  comics: [],
  featuredComics: [],
  currentComic: null,
  pages: [],
  currentPage: null,
  isLoading: false,
  error: null,

  fetchComics: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await comicsApi.getAll(params);
      const comics = (response.data.data.comics || []).map((c: any) => normalizeComic(c));
      set({ comics, isLoading: false });
    } catch (error: any) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  fetchFeatured: async () => {
    try {
      const response = await comicsApi.getFeatured();
      const featuredComics = (response.data.data.comics || []).map((c: any) => normalizeComic(c));
      set({ featuredComics });
    } catch {
      set({ featuredComics: [] });
    }
  },

  fetchComic: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await comicsApi.getById(id);
      const comic = normalizeComic(response.data.data.comic);
      set({ currentComic: comic, isLoading: false });
    } catch (error: any) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  fetchPages: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await comicsApi.getPages(id);
      const { comic, pages } = response.data.data;
      const normalizedComic = normalizeComic(comic);
      const normalizedPages = (pages || []) as ComicPage[];

      set({
        currentComic: normalizedComic,
        pages: normalizedPages,
        currentPage:
          normalizedPages.find((p: ComicPage) => p.pageId === normalizedComic.startPageId) ||
          normalizedPages[0] ||
          null,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  setCurrentPage: (pageId) => {
    const { pages } = get();
    const page = pages.find((item) => item.pageId === pageId);
    if (page) {
      set({ currentPage: page });
    }
  },

  makeChoice: (choiceId, targetPageId) => {
    const { pages, currentComic, currentPage } = get();
    const page = pages.find((item) => item.pageId === targetPageId);
    if (!page) return;

    set({ currentPage: page });

    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (currentComic && isAuthenticated && currentPage) {
      progressApi
        .recordChoice(currentComic.id, {
          pageId: currentPage.pageId,
          choiceId,
          targetPageId,
        })
        .catch(() => {});
    }
  },
}));

