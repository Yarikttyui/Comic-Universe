import { COMIC_SIZES, GENRES } from '../constants';
import type { ComicSize, Genre } from '../types';

export function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
}

export function formatReadCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  }
  if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return `${(count / 1000000).toFixed(1)}M`;
}

export function getComicSizeLabel(size: ComicSize): string {
  return COMIC_SIZES[size]?.label || size;
}

export function getGenreInfo(genre: Genre) {
  return GENRES[genre] || { label: genre, icon: 'BookOpen', color: '#666' };
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU');
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffHour < 24) return `${diffHour} ч назад`;
  if (diffDay === 1) return 'вчера';
  if (diffDay < 7) return `${diffDay} дн назад`;
  
  return formatDateShort(d);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (halfStar ? '½' : '') + 
         '☆'.repeat(emptyStars);
}

export function calculateProgress(visitedPages: number, totalPages: number): number {
  if (totalPages === 0) return 0;
  return Math.round((visitedPages / totalPages) * 100);
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  
  if (mod100 >= 11 && mod100 <= 14) {
    return `${count} ${many}`;
  }
  if (mod10 === 1) {
    return `${count} ${one}`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} ${few}`;
  }
  return `${count} ${many}`;
}

export function pluralizePages(count: number): string {
  return pluralize(count, 'страница', 'страницы', 'страниц');
}

export function pluralizeEndings(count: number): string {
  return pluralize(count, 'концовка', 'концовки', 'концовок');
}

export function pluralizeComics(count: number): string {
  return pluralize(count, 'комикс', 'комикса', 'комиксов');
}
