import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';

interface ReportItem {
  id: string;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: string;
  reporter?: {
    displayName?: string;
    creatorNick?: string;
  };
  comment?: {
    id: string;
    body: string;
    status: 'visible' | 'hidden' | 'deleted';
    comic?: {
      id: string;
      title: string;
    };
    user?: {
      displayName?: string;
      creatorNick?: string;
    };
  };
}

export default function AdminComments() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getCommentReports('open');
      setReports(response.data.data.reports || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить жалобы.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const performAction = async (
    action: 'hide' | 'restore' | 'delete',
    commentId: string,
    message: string
  ) => {
    setError('');
    setInfo('');

    try {
      if (action === 'hide') {
        await adminApi.hideComment(commentId);
      }
      if (action === 'restore') {
        await adminApi.restoreComment(commentId);
      }
      if (action === 'delete') {
        await adminApi.deleteComment(commentId);
      }
      setInfo(message);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Операция не выполнена.');
    }
  };

  return (
    <section className="page">
      <div className="container stack">
        <SectionHeader
          title="Жалобы на комментарии"
          subtitle="Пост-модерация: скрыть, восстановить или удалить комментарий."
          actions={<Button variant="ghost" onClick={load}>Обновить</Button>}
        />

        {error ? <div className="alert alert-error">{error}</div> : null}
        {info ? <div className="alert alert-success">{info}</div> : null}
        {loading ? <div className="notice">Загрузка...</div> : null}

        {reports.length === 0 && !loading ? <EmptyState title="Открытых жалоб нет" /> : null}

        <div className="stack">
          {reports.map((report) => {
            const comment = report.comment;
            if (!comment) return null;

            return (
              <Card key={report.id}>
                <div className="stack">
                  <div className="row-between">
                    <strong>{comment.comic?.title || 'Комикс без названия'}</strong>
                    <StatusPill status={comment.status} />
                  </div>

                  <div className="notice">Причина жалобы: {report.reason}</div>

                  <div>
                    <div className="kpi-label">
                      Автор: {comment.user?.displayName || comment.user?.creatorNick || '-'} · Жалоба от: {report.reporter?.displayName || report.reporter?.creatorNick || '-'}
                    </div>
                    <p style={{ marginTop: '0.5rem' }}>{comment.body}</p>
                  </div>

                  <div className="cluster">
                    <button className="btn btn-outline btn-sm" type="button" onClick={() => performAction('hide', comment.id, 'Комментарий скрыт.')}>
                      Скрыть
                    </button>
                    <button className="btn btn-outline btn-sm" type="button" onClick={() => performAction('restore', comment.id, 'Комментарий восстановлен.')}>
                      Восстановить
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => performAction('delete', comment.id, 'Комментарий удалён.')}>
                      Удалить
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
