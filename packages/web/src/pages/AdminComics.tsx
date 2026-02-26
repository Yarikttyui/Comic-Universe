import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';

interface ComicItem {
  id: string;
  title: string;
  status: string;
  hiddenByAdmin: boolean;
  authorName: string;
  rating: number;
  ratingCount: number;
  readCount: number;
  totalPages: number;
  createdAt: string;
  author?: {
    displayName?: string;
    creatorNick?: string;
    email?: string;
  };
}

interface ComicReportItem {
  id: string;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: string;
  comic?: {
    id: string;
    title: string;
    status: string;
    hiddenByAdmin: boolean;
  };
  reporter?: {
    displayName?: string;
    creatorNick?: string;
  };
}

type Tab = 'comics' | 'reports';

export default function AdminComics() {
  const [tab, setTab] = useState<Tab>('comics');
  const [comics, setComics] = useState<ComicItem[]>([]);
  const [reports, setReports] = useState<ComicReportItem[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const loadComics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getComics('all');
      setComics(response.data.data.comics || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить комиксы.');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getComicReports('open');
      setReports(response.data.data.reports || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить жалобы.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'comics') loadComics();
    else loadReports();
  }, [tab]);

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
      await loadComics();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Операция не выполнена.');
    }
  };

  const resolveReport = async (reportId: string, comicId?: string) => {
    setError('');
    setInfo('');
    try {
      if (comicId) {
        await adminApi.hideComic(comicId);
      }
      await adminApi.resolveComicReport(reportId);
      setInfo(comicId ? 'Комикс скрыт, жалоба закрыта.' : 'Жалоба закрыта.');
      await loadReports();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Операция не выполнена.');
    }
  };

  return (
    <section className="page">
      <div className="container stack">
        <SectionHeader
          title="Управление комиксами"
          subtitle="Все комиксы и жалобы пользователей."
          actions={
            <Button variant="ghost" onClick={() => (tab === 'comics' ? loadComics() : loadReports())}>
              Обновить
            </Button>
          }
        />

        <div className="cluster">
          <button
            className={`btn ${tab === 'comics' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            type="button"
            onClick={() => setTab('comics')}
          >
            Все комиксы
          </button>
          <button
            className={`btn ${tab === 'reports' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            type="button"
            onClick={() => setTab('reports')}
          >
            Жалобы на комиксы
          </button>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}
        {info ? <div className="alert alert-success">{info}</div> : null}
        {loading ? <div className="notice">Загрузка...</div> : null}

        {tab === 'comics' && (
          <div className="stack">
            {comics.length === 0 && !loading ? <EmptyState title="Комиксов нет" /> : null}
            {comics.map((comic) => (
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
                    Автор: {comic.author?.displayName || comic.author?.creatorNick || comic.authorName} ·
                    Рейтинг: {Number(comic.rating).toFixed(1)} ({comic.ratingCount}) ·
                    Чтений: {comic.readCount} ·
                    Сцен: {comic.totalPages} ·
                    {new Date(comic.createdAt).toLocaleDateString('ru-RU')}
                  </div>

                  <div className="cluster">
                    <button
                      className={`btn ${comic.hiddenByAdmin ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      type="button"
                      onClick={() => toggleHidden(comic.id, comic.hiddenByAdmin)}
                    >
                      {comic.hiddenByAdmin ? 'Показать' : 'Скрыть'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'reports' && (
          <div className="stack">
            {reports.length === 0 && !loading ? <EmptyState title="Открытых жалоб нет" /> : null}
            {reports.map((report) => (
              <Card key={report.id}>
                <div className="stack">
                  <div className="row-between">
                    <strong>{report.comic?.title || 'Комикс без названия'}</strong>
                    <StatusPill status={report.comic?.hiddenByAdmin ? 'hidden' : report.comic?.status || 'draft'} />
                  </div>

                  <div className="notice">Причина: {report.reason}</div>
                  <div className="kpi-label">
                    Жалоба от: {report.reporter?.displayName || report.reporter?.creatorNick || '-'} ·
                    {new Date(report.createdAt).toLocaleDateString('ru-RU')}
                  </div>

                  <div className="cluster">
                    <button
                      className="btn btn-outline btn-sm"
                      type="button"
                      onClick={() => resolveReport(report.id, report.comic?.id)}
                    >
                      Скрыть комикс
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => resolveReport(report.id)}
                    >
                      Закрыть жалобу
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
