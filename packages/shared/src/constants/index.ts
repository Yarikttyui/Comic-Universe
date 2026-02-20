export const APP_NAME = 'Comic Universe';
export const APP_VERSION = '1.0.0';

export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const COMIC_SIZES = {
  small: {
    label: 'Короткий',
    description: '5-15 страниц, 5-10 мин',
    minPages: 5,
    maxPages: 15,
  },
  medium: {
    label: 'Средний', 
    description: '16-40 страниц, 15-30 мин',
    minPages: 16,
    maxPages: 40,
  },
  large: {
    label: 'Большой',
    description: '40+ страниц, 30+ мин',
    minPages: 41,
    maxPages: Infinity,
  },
} as const;

export const GENRES = {
  adventure: { label: 'Приключения', icon: '🗺️', color: '#4CAF50' },
  fantasy: { label: 'Фэнтези', icon: '🧙', color: '#9C27B0' },
  scifi: { label: 'Научная фантастика', icon: '🚀', color: '#2196F3' },
  horror: { label: 'Ужасы', icon: '👻', color: '#424242' },
  romance: { label: 'Романтика', icon: '💕', color: '#E91E63' },
  mystery: { label: 'Детектив', icon: '🔍', color: '#795548' },
  action: { label: 'Экшен', icon: '💥', color: '#FF5722' },
  cyberpunk: { label: 'Киберпанк', icon: '🤖', color: '#00ACC1' },
  comedy: { label: 'Комедия', icon: '😂', color: '#FFEB3B' },
  drama: { label: 'Драма', icon: '🎭', color: '#607D8B' },
  thriller: { label: 'Триллер', icon: '😱', color: '#F44336' },
} as const;

export const ENDING_TYPES = {
  good: { label: 'Хорошая концовка', icon: '🌟', color: '#4CAF50' },
  bad: { label: 'Плохая концовка', icon: '💀', color: '#F44336' },
  neutral: { label: 'Нейтральная концовка', icon: '🤷', color: '#9E9E9E' },
  secret: { label: 'Секретная концовка', icon: '🔮', color: '#9C27B0' },
} as const;

export const ACHIEVEMENTS = {
  first_comic: {
    id: 'first_comic',
    title: 'Первые шаги',
    description: 'Прочитайте свой первый комикс',
    icon: '📖',
  },
  explorer: {
    id: 'explorer',
    title: 'Исследователь',
    description: 'Найдите все концовки в одном комиксе',
    icon: '🔍',
  },
  speed_reader: {
    id: 'speed_reader',
    title: 'Скорочтение',
    description: 'Прочитайте комикс менее чем за 5 минут',
    icon: '⚡',
  },
  collector: {
    id: 'collector',
    title: 'Коллекционер',
    description: 'Прочитайте 10 комиксов',
    icon: '📚',
  },
  decisive: {
    id: 'decisive',
    title: 'Решительный',
    description: 'Сделайте 100 выборов',
    icon: '⚖️',
  },
  night_owl: {
    id: 'night_owl',
    title: 'Ночная сова',
    description: 'Читайте комиксы после полуночи',
    icon: '🦉',
  },
  completionist: {
    id: 'completionist',
    title: 'Перфекционист',
    description: 'Разблокируйте все концовки в 5 комиксах',
    icon: '🏆',
  },
} as const;

export const VALIDATION = {
  creatorNick: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  password: {
    minLength: 8,
    maxLength: 100,
  },
  email: {
    maxLength: 255,
  },
  comicTitle: {
    minLength: 1,
    maxLength: 100,
  },
  comicDescription: {
    maxLength: 1000,
  },
} as const;

export const LIMITS = {
  maxFileSize: 10 * 1024 * 1024,
  maxPanelsPerPage: 10,
  maxChoicesPerPage: 6,
  maxDialoguesPerPanel: 10,
} as const;
