import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { creatorsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';

interface CreatorProfile {
  id: string;
  displayName: string;
  avatar?: string;
  creatorNick?: string;
  bio?: string;
  createdAt: string;
}

interface CreatorComic {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  rating: number;
  ratingCount: number;
  readCount: number;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export default function CreatorPublicProfile() {
  const { creatorNick } = useParams<{ creatorNick: string }>();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [comics, setComics] = useState<CreatorComic[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!creatorNick) return;

    setLoading(true);
    setError('');

    creatorsApi
      .getByCreatorNick(creatorNick)
      .then((response) => {
        setCreator(response.data.data.creator);
        setComics(
          (response.data.data.comics || []).map((comic: any) => ({
            ...comic,
            rating: toNumber(comic?.rating, 0),
            ratingCount: toNumber(comic?.ratingCount, 0),
            readCount: toNumber(comic?.readCount, 0),
          }))
        );
      })
      .catch((err: any) => {
        setError(err?.response?.data?.error?.message || 'Профиль создателя не найден.');
      })
      .finally(() => setLoading(false));
  }, [creatorNick]);

  return (
    <section className="page">
      <div className="container stack">
        {loading ? <div className="notice">Загрузка профиля...</div> : null}
        {error ? <div className="alert alert-error">{error}</div> : null}

        {creator ? (
          <>
            <Card>
              <div className="stack">
                <SectionHeader
                  title={creator.displayName}
                  subtitle={creator.bio || 'Создатель интерактивных комиксов'}
                  actions={creator.creatorNick ? <Tag tone="accent">@{creator.creatorNick}</Tag> : null}
                />
                <div className="cluster">
                  {creator.avatar ? (
                    <img src={creator.avatar} alt={creator.displayName} style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover' }} />
                  ) : null}
                  <Tag tone="soft">С нами с {new Date(creator.createdAt).toLocaleDateString('ru-RU')}</Tag>
                </div>
              </div>
            </Card>

            <SectionHeader title="Опубликованные работы" />
            {comics.length === 0 ? (
              <EmptyState title="Пока нет работ" />
            ) : (
              <div className="comic-grid">
                {comics.map((comic) => (
                  <Link key={comic.id} to={`/comic/${comic.id}`} className="comic-card">
                    <div className="comic-cover">{comic.coverImage ? <img src={comic.coverImage} alt={comic.title} /> : null}</div>
                    <div className="comic-body stack">
                      <div className="comic-title">{comic.title}</div>
                      <div className="comic-desc">{comic.description}</div>
                      <div className="cluster">
                        <Tag>Рейтинг {comic.rating.toFixed(1)}</Tag>
                        <Tag tone="soft">Оценок {comic.ratingCount}</Tag>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
