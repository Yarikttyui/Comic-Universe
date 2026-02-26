import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, Clock3, Flag, GitBranch, Heart, LogIn, MessageSquare, Star } from 'lucide-react';
import { comicsApi, usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Comic } from '../store/comicsStore';
import { SubscribeButton } from '../components/ui/SubscribeButton';

const GENRE_RU: Record<string, string> = {
  adventure: 'Приключения',
  fantasy: 'Фэнтези',
  scifi: 'Фантастика',
  'sci-fi': 'Фантастика',
  horror: 'Ужасы',
  romance: 'Романтика',
  mystery: 'Детектив',
  action: 'Экшен',
  cyberpunk: 'Киберпанк',
  comedy: 'Комедия',
  drama: 'Драма',
  thriller: 'Триллер',
};
const genreRu = (g: string) => GENRE_RU[g.toLowerCase()] || g;
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Tag } from '../components/ui/Tag';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

interface ComicComment {
  id: string;
  body: string;
  createdAt: string;
  status: 'visible' | 'hidden' | 'deleted';
  user: {
    id: string;
    displayName?: string;
    role: string;
    creatorNick?: string | null;
  } | null;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export default function ComicDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();

  const [comic, setComic] = useState<Comic | null>(null);
  const [comments, setComments] = useState<ComicComment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [commentBody, setCommentBody] = useState('');
  const [rating, setRating] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const creatorNick =
    comic?.authorCreatorNick ||
    (/^[a-zA-Z0-9_]{3,50}$/.test(comic?.authorName || '') ? comic?.authorName : null);

  const sizeLabel =
    comic?.size === 'small'
      ? 'Короткий формат'
      : comic?.size === 'medium'
        ? 'Средний формат'
        : 'Большой формат';

  const load = async (targetPage = 1) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [comicResponse, commentsResponse] = await Promise.allSettled([
        comicsApi.getById(id),
        comicsApi.getComments(id, { page: targetPage, limit: 10 }),
      ]);

      if (comicResponse.status === 'rejected') {
        throw comicResponse.reason;
      }

      const rawComic = comicResponse.value.data.data.comic;
      setComic({
        ...rawComic,
        rating: toNumber(rawComic?.rating, 0),
        ratingCount: toNumber(rawComic?.ratingCount, 0),
        readCount: toNumber(rawComic?.readCount, 0),
        totalPages: toNumber(rawComic?.totalPages, 0),
        totalEndings: toNumber(rawComic?.totalEndings, 0),
        estimatedMinutes: toNumber(rawComic?.estimatedMinutes, 0),
      });

      if (commentsResponse.status === 'fulfilled') {
        setComments(commentsResponse.value.data.data.comments || []);
        setPage(commentsResponse.value.data.meta?.page || targetPage);
        setTotalPages(commentsResponse.value.data.meta?.totalPages || 1);
      } else {
        setComments([]);
        setPage(1);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить комикс.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    usersApi.getProfile().then((r) => {
      const favs = r.data.data.user?.favoriteComics || [];
      setIsFavorite(favs.some((f: any) => f.id === id));
    }).catch(() => {});
  }, [id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!id || !isAuthenticated) return;
    setFavBusy(true);
    try {
      if (isFavorite) {
        await usersApi.removeFavorite(id);
        setIsFavorite(false);
      } else {
        await usersApi.addFavorite(id);
        setIsFavorite(true);
      }
    } catch {
    } finally {
      setFavBusy(false);
    }
  };

  const handleRate = async () => {
    if (!id || !isAuthenticated || rating < 1 || rating > 5) return;
    try {
      const response = await comicsApi.rate(id, rating);
      setComic((prev) =>
        prev
          ? {
              ...prev,
              rating: toNumber(response.data.data.rating, prev.rating),
              ratingCount: toNumber(response.data.data.ratingCount, prev.ratingCount),
            }
          : prev
      );
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось сохранить оценку.');
    }
  };

  const handleAddComment = async () => {
    if (!id || !isAuthenticated || !commentBody.trim()) return;
    try {
      await comicsApi.addComment(id, commentBody.trim());
      setCommentBody('');
      await load(1);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось добавить комментарий.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    try {
      await comicsApi.deleteComment(id, commentId);
      await load(page);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось удалить комментарий.');
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!id) return;
    const reason = window.prompt('Причина жалобы');
    if (!reason || !reason.trim()) return;

    try {
      await comicsApi.reportComment(id, commentId, reason.trim());
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось отправить жалобу.');
    }
  };

  const handleReportComic = async () => {
    if (!id) return;
    const reason = window.prompt('Причина жалобы на комикс');
    if (!reason || !reason.trim()) return;

    try {
      await comicsApi.reportComic(id, reason.trim());
      alert('Жалоба отправлена');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось отправить жалобу.');
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="container notice">Загрузка...</div>
      </section>
    );
  }

  if (!comic) {
    return (
      <section className="page">
        <div className="container">
          <EmptyState title="Комикс недоступен" description="Комикс не найден или ещё не опубликован." />
        </div>
      </section>
    );
  }

  return (
    <section className="page comic-detail-page">
      <div className="container stack comic-detail-shell">
        <Card className="comic-detail-hero-card">
          <div className="comic-detail-hero-grid">
            <div className="comic-detail-cover-wrap">
              <div className="comic-cover comic-detail-cover">
                {comic.coverImage ? <img src={comic.coverImage} alt={comic.title} /> : null}
              </div>
            </div>

            <div className="comic-detail-main stack">
              <div className="cluster">
                <Tag tone="accent">{sizeLabel}</Tag>
                <Tag tone="soft">{comic.totalPages} сцен</Tag>
                <Tag tone="soft">{comic.totalEndings} концовок</Tag>
              </div>

              <h1 className="comic-detail-title">{comic.title}</h1>
              <p className="comic-detail-subtitle">{comic.description}</p>

              {creatorNick ? (
                <div className="cluster">
                  <Link className="btn btn-ghost btn-sm" to={`/creator/${encodeURIComponent(creatorNick)}`}>
                    Профиль создателя
                  </Link>
                  {(comic as any).authorId && <SubscribeButton authorId={(comic as any).authorId} />}
                </div>
              ) : null}

              <div className="comic-stat-grid">
                <div className="comic-stat-item">
                  <span className="comic-stat-label"><Star size={14} /> Рейтинг</span>
                  <strong className="comic-stat-value">{comic.rating.toFixed(1)}</strong>
                </div>
                <div className="comic-stat-item">
                  <span className="comic-stat-label"><MessageSquare size={14} /> Оценок</span>
                  <strong className="comic-stat-value">{comic.ratingCount}</strong>
                </div>
                <div className="comic-stat-item">
                  <span className="comic-stat-label"><BookOpen size={14} /> Чтений</span>
                  <strong className="comic-stat-value">{comic.readCount}</strong>
                </div>
                <div className="comic-stat-item">
                  <span className="comic-stat-label"><Clock3 size={14} /> Время</span>
                  <strong className="comic-stat-value">{comic.estimatedMinutes} мин</strong>
                </div>
                <div className="comic-stat-item">
                  <span className="comic-stat-label"><GitBranch size={14} /> Жанры</span>
                  <strong className="comic-stat-value">
                    {comic.genres?.length ? comic.genres.slice(0, 2).map(genreRu).join(' · ') : 'Не указаны'}
                  </strong>
                </div>
              </div>

              {isAuthenticated ? (
                <div className="cluster">
                  <Link className="btn btn-primary btn-lg" to={`/comic/${comic.id}/read`}>
                    Читать комикс
                  </Link>
                  <button
                    className={`btn btn-outline btn-sm favorite-btn${isFavorite ? ' is-fav' : ''}`}
                    type="button"
                    onClick={toggleFavorite}
                    disabled={favBusy}
                  >
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? 'В избранном' : 'В избранное'}
                  </button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={handleReportComic}>
                    <Flag size={14} /> Пожаловаться
                  </button>
                </div>
              ) : (
                <div className="comic-read-gate">
                  <div className="comic-read-gate-title">
                    <LogIn size={16} /> Читать могут только зарегистрированные пользователи
                  </div>
                  <div className="cluster">
                    <Link
                      className="btn btn-primary btn-md"
                      to="/login"
                      state={{ from: { pathname: `/comic/${comic.id}/read` } }}
                    >
                      Войти и читать
                    </Link>
                    <Link className="btn btn-outline btn-md" to="/register">
                      Создать аккаунт
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid-2">
          <Card>
            <div className="stack">
              <strong>Оценка комикса</strong>
              {!isAuthenticated ? (
                <div className="notice">Оценки и комментарии доступны после входа.</div>
              ) : null}
              {isAuthenticated ? (
                <div className="cluster">
                  <select className="select" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                    <option value={0}>Выберите оценку</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                  <Button type="button" onClick={handleRate}>Сохранить</Button>
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <div className="stack">
              <strong>Перед чтением</strong>
              <div className="notice">
                Все ключевые решения сохраняются в прогрессе аккаунта. Можно вернуться позже и продолжить с текущей ветки.
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="stack">
            <div className="row-between">
              <strong>Комментарии</strong>
              <Tag tone="soft">{page} / {totalPages}</Tag>
            </div>

            {isAuthenticated ? (
              <>
                <Field label="Новый комментарий">
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="Напишите комментарий"
                    value={commentBody}
                    onChange={(event) => setCommentBody(event.target.value)}
                  />
                </Field>
                <Button type="button" onClick={handleAddComment}>Отправить</Button>
              </>
            ) : null}

            <div>
              {comments.map((comment) => {
                const canDelete = isAuthenticated && (user?.role === 'admin' || comment.user?.id === user?.id);
                return (
                  <div key={comment.id} className="comment-item">
                    <div className="row-between" style={{ marginBottom: '0.35rem' }}>
                      <strong>
                        {comment.user?.displayName || comment.user?.creatorNick || 'Пользователь'}
                        {comment.user?.creatorNick ? ` · @${comment.user.creatorNick}` : ''}
                      </strong>
                      <span className="kpi-label">{new Date(comment.createdAt).toLocaleString('ru-RU')}</span>
                    </div>
                    <p style={{ marginBottom: '0.55rem' }}>{comment.body}</p>
                    <div className="cluster">
                      {canDelete ? (
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => handleDeleteComment(comment.id)}>
                          Удалить
                        </button>
                      ) : null}
                      {isAuthenticated && comment.user?.id !== user?.id ? (
                        <button className="btn btn-outline btn-sm" type="button" onClick={() => handleReportComment(comment.id)}>
                          Пожаловаться
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {comments.length === 0 ? <EmptyState title="Комментариев пока нет" /> : null}
            </div>

            <div className="row-between">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => load(page - 1)} type="button">
                Назад
              </button>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => load(page + 1)} type="button">
                Вперёд
              </button>
            </div>
          </div>
        </Card>

        {error ? <div className="alert alert-error">{error}</div> : null}
      </div>
    </section>
  );
}
