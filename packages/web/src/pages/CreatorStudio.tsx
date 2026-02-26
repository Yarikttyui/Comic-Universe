import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { creatorApi, uploadsApi, adminApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button, LinkButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { Tag } from '../components/ui/Tag';
import { EmptyState } from '../components/ui/EmptyState';

interface CreatorComicItem {
  comic: {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    status: string;
    updatedAt: string;
  };
  latestRevision: {
    id: string;
    version: number;
    status: 'draft' | 'pending_review' | 'approved' | 'rejected';
    submittedAt?: string | null;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
  } | null;
}

interface AdminComicItem {
  id: string;
  title: string;
  status: string;
  hiddenByAdmin: boolean;
  authorName: string;
  author?: { displayName?: string; creatorNick?: string };
  rating: number;
  ratingCount: number;
  readCount: number;
  totalPages: number;
  createdAt: string;
}

export default function CreatorStudio() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState<CreatorComicItem[]>([]);
  const [allComics, setAllComics] = useState<AdminComicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    coverFileId: '',
    coverPreview: '',
    genres: '',
    tags: '',
    estimatedMinutes: 8,
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await creatorApi.getMyComics();
      setItems(response.data.data.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить список работ.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllComics = async () => {
    if (!isAdmin) return;
    try {
      const response = await adminApi.getComics('all');
      setAllComics(response.data.data.comics || []);
    } catch {}
  };

  useEffect(() => {
    load();
    loadAllComics();
  }, []);

  const handleUploadCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadsApi.uploadFile(file, 'comic-cover');
      const uploaded = response.data.data.file;
      setCreateForm((prev) => ({
        ...prev,
        coverFileId: uploaded.id,
        coverPreview: uploaded.publicUrl || file.name,
      }));
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить обложку.');
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!createForm.title.trim() || !createForm.description.trim()) {
      setError('Заполните название и описание.');
      return;
    }

    try {
      const response = await creatorApi.createComic({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        coverFileId: createForm.coverFileId || undefined,
        genres: createForm.genres
          .split(',')
          .map((genre) => genre.trim())
          .filter(Boolean),
        tags: createForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        estimatedMinutes: Number(createForm.estimatedMinutes),
      });
      const comicId = response.data.data.comic.id;
      navigate(`/creator/editor/${comicId}`);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось создать черновик.');
    }
  };

  const handleSubmit = async (comicId: string) => {
    try {
      await creatorApi.submitComic(comicId);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось отправить на модерацию.');
    }
  };

  const handleDelete = async (comicId: string, title: string) => {
    if (!window.confirm(`Удалить комикс «${title}»? Это действие необратимо.`)) return;
    try {
      await creatorApi.deleteComic(comicId);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось удалить комикс.');
    }
  };

  const toggleHidden = async (comicId: string, currentlyHidden: boolean) => {
    setError('');
    setInfo('');
    try {
      if (currentlyHidden) {
        await adminApi.unhideComic(comicId);
        setInfo('Комикс показан.');
      } else {
        await adminApi.hideComic(comicId);
        setInfo('Комикс скрыт.');
      }
      await loadAllComics();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Операция не выполнена.');
    }
  };

  return (
    <section className="page">
      <div className="container stack">
        <SectionHeader title="Студия создателя" subtitle="Создание сцен и ветвлений через hotspot-кнопки." />

        <Card>
          <div className="stack">
            <strong>Новый комикс</strong>
            <div className="grid-2">
              <Field label="Название">
                <input
                  className="input"
                  value={createForm.title}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </Field>

              <Field label="Файл обложки" hint={createForm.coverPreview ? `Загружено: ${createForm.coverPreview}` : undefined}>
                <input className="input" type="file" onChange={handleUploadCover} />
              </Field>

              <Field label="Описание">
                <textarea
                  className="textarea"
                  rows={3}
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </Field>

              <div className="stack">
                <Field label="Жанры (через запятую)">
                  <input
                    className="input"
                    value={createForm.genres}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, genres: event.target.value }))}
                  />
                </Field>
                <Field label="Теги (через запятую)">
                  <input
                    className="input"
                    value={createForm.tags}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, tags: event.target.value }))}
                  />
                </Field>
                <Field label="Оценка времени (мин)">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={createForm.estimatedMinutes}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, estimatedMinutes: Number(event.target.value) }))
                    }
                  />
                </Field>
              </div>
            </div>
            <Button type="button" onClick={handleCreate}>Создать и открыть редактор</Button>
          </div>
        </Card>

        {error ? <div className="alert alert-error">{error}</div> : null}
        {info ? <div className="alert alert-success">{info}</div> : null}
        {loading ? <div className="notice">Загрузка...</div> : null}

        <SectionHeader title="Мои работы" actions={<Button variant="ghost" onClick={load}>Обновить</Button>} />

        {items.length === 0 && !loading ? (
          <EmptyState title="У вас пока нет комиксов" />
        ) : (
          <div className="stack">
            {items.map((item) => {
              const revisionStatus = item.latestRevision?.status || 'draft';
              const canSubmit = revisionStatus === 'draft' || revisionStatus === 'rejected';

              return (
                <Card key={item.comic.id}>
                  <div className="stack">
                    <div className="row-between">
                      <div className="stack" style={{ gap: '0.35rem' }}>
                        <strong>{item.comic.title}</strong>
                        <div className="cluster">
                          <StatusPill status={item.comic.status || 'draft'} />
                          <StatusPill status={revisionStatus} />
                          <Tag tone="soft">v{item.latestRevision?.version || '-'}</Tag>
                        </div>
                      </div>

                      <div className="cluster">
                        <LinkButton to={`/creator/editor/${item.comic.id}`} variant="outline">Редактировать</LinkButton>
                        <Button type="button" onClick={() => handleSubmit(item.comic.id)} disabled={!canSubmit}>
                          На модерацию
                        </Button>
                        <Button type="button" variant="danger" onClick={() => handleDelete(item.comic.id, item.comic.title)}>
                          Удалить
                        </Button>
                      </div>
                    </div>

                    {item.latestRevision?.rejectionReason ? (
                      <div className="notice">Причина отклонения: {item.latestRevision.rejectionReason}</div>
                    ) : null}

                    <span className="kpi-label">Обновлено: {new Date(item.comic.updatedAt).toLocaleString('ru-RU')}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {isAdmin ? (
          <>
            <SectionHeader title="Все комиксы" subtitle="Управление всеми комиксами на платформе." actions={<Button variant="ghost" onClick={loadAllComics}>Обновить</Button>} />
            {allComics.length === 0 ? <EmptyState title="Комиксов нет" /> : (
              <div className="stack">
                {allComics.map((comic) => (
                  <Card key={comic.id}>
                    <div className="stack">
                      <div className="row-between">
                        <strong>{comic.title}</strong>
                        <div className="cluster">
                          <StatusPill status={comic.status} />
                          {comic.hiddenByAdmin ? <StatusPill status="hidden" /> : null}
                        </div>
                      </div>
                      <div className="kpi-label">
                        Автор: {comic.author?.displayName || comic.author?.creatorNick || comic.authorName} · Рейтинг: {Number(comic.rating).toFixed(1)} ({comic.ratingCount}) · Чтений: {comic.readCount} · Сцен: {comic.totalPages} · {new Date(comic.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="cluster">
                        <button className={`btn ${comic.hiddenByAdmin ? 'btn-primary' : 'btn-outline'} btn-sm`} type="button" onClick={() => toggleHidden(comic.id, comic.hiddenByAdmin)}>
                          {comic.hiddenByAdmin ? 'Показать' : 'Скрыть'}
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
