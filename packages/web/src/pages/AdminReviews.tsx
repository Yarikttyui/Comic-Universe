import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatusPill } from '../components/ui/StatusPill';
import { EmptyState } from '../components/ui/EmptyState';
import { Tag } from '../components/ui/Tag';

interface RevisionItem {
  id: string;
  comicId: string;
  version: number;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  submittedAt?: string;
  comic?: {
    id: string;
    title: string;
    status: string;
  };
  creator?: {
    displayName: string;
    creatorNick?: string;
  };
}

export default function AdminReviews() {
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);
  const [selectedId, setSelectedId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getRevisions('pending_review');
      setRevisions(response.data.data.revisions || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить очередь ревью.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (revisionId: string) => {
    setError('');
    try {
      const response = await adminApi.getRevision(revisionId);
      setSelectedId(revisionId);
      setSelectedRevision(response.data.data.revision);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить ревизию.');
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const approve = async () => {
    if (!selectedId) return;
    setInfo('');
    setError('');
    try {
      await adminApi.approveRevision(selectedId);
      setInfo('Ревизия одобрена и опубликована.');
      setSelectedRevision(null);
      setSelectedId('');
      await loadQueue();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось одобрить ревизию.');
    }
  };

  const reject = async () => {
    if (!selectedId) return;
    if (!reason.trim()) {
      setError('Укажите причину отклонения.');
      return;
    }

    setInfo('');
    setError('');

    try {
      await adminApi.rejectRevision(selectedId, reason.trim());
      setInfo('Ревизия отклонена.');
      setReason('');
      setSelectedRevision(null);
      setSelectedId('');
      await loadQueue();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось отклонить ревизию.');
    }
  };

  return (
    <section className="page">
      <div className="container stack">
        <SectionHeader
          title="Ревизии на модерации"
          subtitle="Публикация доступна только после проверки администратора."
          actions={<Button variant="ghost" onClick={loadQueue}>Обновить</Button>}
        />

        {error ? <div className="alert alert-error">{error}</div> : null}
        {info ? <div className="alert alert-success">{info}</div> : null}

        <div className="grid-2">
          <Card>
            <div className="stack">
              <strong>Очередь</strong>
              {loading ? <div className="notice">Загрузка...</div> : null}
              {revisions.length === 0 && !loading ? <EmptyState title="Очередь пуста" /> : null}

              {revisions.map((revision) => (
                <button
                  key={revision.id}
                  className="btn btn-outline btn-md"
                  type="button"
                  onClick={() => loadDetails(revision.id)}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>{revision.comic?.title || revision.comicId}</span>
                  <Tag tone="soft">v{revision.version}</Tag>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="stack">
              <strong>Детали</strong>
              {!selectedRevision ? <EmptyState title="Выберите ревизию" /> : null}

              {selectedRevision ? (
                <>
                  <div className="cluster">
                    <StatusPill status={selectedRevision.status} />
                    <Tag tone="soft">v{selectedRevision.version}</Tag>
                    <Tag tone="soft">{selectedRevision.creator?.creatorNick || selectedRevision.creator?.displayName}</Tag>
                  </div>

                  <div className="notice">
                    Узлов в payload: {selectedRevision.payloadJson?.nodes?.length || 0}
                    <br />
                    Отправлено: {selectedRevision.submittedAt ? new Date(selectedRevision.submittedAt).toLocaleString('ru-RU') : '-'}
                  </div>

                  <Field label="Причина отклонения">
                    <textarea
                      className="textarea"
                      rows={4}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </Field>

                  <div className="cluster">
                    <Button type="button" onClick={approve}>Одобрить</Button>
                    <Button type="button" variant="danger" onClick={reject}>Отклонить</Button>
                    {selectedRevision.comicId && (
                      <Link
                        className="btn btn-ghost btn-md"
                        to={`/comic/${selectedRevision.comicId}`}
                        target="_blank"
                      >
                        Открыть комикс
                      </Link>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
