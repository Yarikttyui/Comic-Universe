import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useComicsStore } from '../store/comicsStore';
import { useAuthStore } from '../store/authStore';
import { Field } from '../components/ui/Field';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Tag } from '../components/ui/Tag';

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

const GENRES = [
  { value: '', label: 'Все жанры' },
  { value: 'adventure', label: 'Приключения' },
  { value: 'action', label: 'Экшен' },
  { value: 'fantasy', label: 'Фэнтези' },
  { value: 'sci-fi', label: 'Фантастика' },
  { value: 'horror', label: 'Ужасы' },
  { value: 'thriller', label: 'Триллер' },
  { value: 'comedy', label: 'Комедия' },
  { value: 'drama', label: 'Драма' },
];

const SIZES = [
  { value: '', label: 'Любой размер' },
  { value: 'small', label: 'Короткий' },
  { value: 'medium', label: 'Средний' },
  { value: 'large', label: 'Длинный' },
];

export default function Library() {
  const { comics, fetchComics, isLoading } = useComicsStore();
  const { isAuthenticated } = useAuthStore();

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [size, setSize] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchComics({
        search: search || undefined,
        genres: genre || undefined,
        size: size || undefined,
      });
    }, 260);

    return () => clearTimeout(timeout);
  }, [fetchComics, genre, search, size]);

  return (
    <section className="page">
      <div className="container stack">
        <SectionHeader title="Библиотека" subtitle="Публикуются только одобренные релизы." />
        {!isAuthenticated ? (
          <div className="library-access-note">
            <div>
              Читать интерактивные комиксы можно только после входа в аккаунт.
            </div>
            <div className="cluster">
              <Link className="btn btn-primary btn-sm" to="/login">
                Войти
              </Link>
              <Link className="btn btn-outline btn-sm" to="/register">
                Регистрация
              </Link>
            </div>
          </div>
        ) : null}

        <div className="grid-3">
          <Field label="Поиск">
            <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название или описание" />
          </Field>

          <Field label="Жанр">
            <select className="select" value={genre} onChange={(event) => setGenre(event.target.value)}>
              {GENRES.map((item) => (
                <option key={item.value || 'all'} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Длина">
            <select className="select" value={size} onChange={(event) => setSize(event.target.value)}>
              {SIZES.map((item) => (
                <option key={item.value || 'all'} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {isLoading ? <div className="notice">Загрузка...</div> : null}

        {!isLoading && comics.length === 0 ? (
          <EmptyState title="Ничего не найдено" description="Измените фильтры или добавьте новый релиз в студии." />
        ) : (
          <div className="comic-grid">
            {comics.map((comic) => (
              <Link key={comic.id} to={`/comic/${comic.id}`} className="comic-card">
                <div className="comic-cover">{comic.coverImage ? <img src={comic.coverImage} alt={comic.title} /> : null}</div>
                <div className="comic-body stack">
                  <div className="comic-title">{comic.title}</div>
                  <div className="comic-desc">{comic.description}</div>
                  <div className="comic-card-meta">
                    <Tag>Рейтинг: {comic.rating.toFixed(1)}</Tag>
                    <Tag tone="soft">Сцен: {comic.totalPages}</Tag>
                    <Tag tone="soft">{comic.estimatedMinutes} мин</Tag>
                  </div>
                  <div className="comic-card-foot">
                    <span className="kpi-label">Жанры</span>
                    <span>{comic.genres?.length ? comic.genres.slice(0, 2).map(genreRu).join(' · ') : 'Без жанра'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
