import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Tag } from '../components/ui/Tag';
import { StatusPill } from '../components/ui/StatusPill';

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface CreatorRequestItem {
  id: string;
  desiredNick: string;
  motivation?: string | null;
  status: RequestStatus;
  adminComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    creatorNick?: string | null;
  };
  reviewer?: {
    id: string;
    displayName: string;
    creatorNick?: string | null;
    email?: string;
  };
}

export default function AdminCreatorRequests() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'cancelled' | 'all'>('pending');
  const [requests, setRequests] = useState<CreatorRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CreatorRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = async (targetStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getCreatorRequests(targetStatus);
      const list = response.data.data.requests || [];
      setRequests(list);
      if (selectedRequest) {
        const refreshed = list.find((item: CreatorRequestItem) => item.id === selectedRequest.id) || null;
        setSelectedRequest(refreshed);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить заявки.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const approve = async () => {
    if (!selectedRequest) return;
    setError('');
    setInfo('');
    try {
      await adminApi.approveCreatorRequest(selectedRequest.id, approveComment.trim() || undefined);
      setInfo('Заявка одобрена. Пользователь переведен в создатели.');
      setApproveComment('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось одобрить заявку.');
    }
  };

  const reject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) {
      setError('Укажите причину отклонения.');
      return;
    }
    setError('');
    setInfo('');
    try {
      await adminApi.rejectCreatorRequest(selectedRequest.id, rejectReason.trim());
      setInfo('Заявка отклонена.');
      setRejectReason('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось отклонить заявку.');
    }
  };

  return (
    <section className="page">
      <div className="container stack">
        <SectionHeader
          title="Заявки на роль создателя"
          subtitle="Читатели подают заявки, администратор одобряет или отклоняет."
          actions={<Button variant="ghost" onClick={() => load()}>Обновить</Button>}
        />

        {error ? <div className="alert alert-error">{error}</div> : null}
        {info ? <div className="alert alert-success">{info}</div> : null}

        <div className="grid-2">
          <Card>
            <div className="stack">
              <Field label="Фильтр статуса">
                <select className="select" value={status} onChange={(event) => setStatus(event.target.value as any)}>
                  <option value="pending">На рассмотрении</option>
                  <option value="approved">Одобрено</option>
                  <option value="rejected">Отклонено</option>
                  <option value="cancelled">Закрыто</option>
                  <option value="all">Все</option>
                </select>
              </Field>

              {loading ? <div className="notice">Загрузка...</div> : null}
              {!loading && requests.length === 0 ? <EmptyState title="Заявок нет" /> : null}

              {requests.map((item) => (
                <button
                  key={item.id}
                  className="btn btn-outline btn-md"
                  type="button"
                  onClick={() => setSelectedRequest(item)}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span>{item.user?.displayName || item.user?.email || item.id}</span>
                  <StatusPill status={item.status} />
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="stack">
              <strong>Детали заявки</strong>
              {!selectedRequest ? <EmptyState title="Выберите заявку" /> : null}

              {selectedRequest ? (
                <>
                  <div className="cluster">
                    <Tag tone="accent">@{selectedRequest.desiredNick}</Tag>
                    <StatusPill status={selectedRequest.status} />
                  </div>

                  <div className="notice">
                    Пользователь: {selectedRequest.user?.displayName || '-'} ({selectedRequest.user?.email || '-'})
                    <br />
                    Отправлена: {new Date(selectedRequest.createdAt).toLocaleString('ru-RU')}
                    {selectedRequest.reviewedAt ? (
                      <>
                        <br />
                        Обработана: {new Date(selectedRequest.reviewedAt).toLocaleString('ru-RU')}
                      </>
                    ) : null}
                  </div>

                  {selectedRequest.motivation ? (
                    <div className="card-muted card">
                      <strong>Комментарий автора заявки</strong>
                      <p style={{ marginTop: '0.5rem' }}>{selectedRequest.motivation}</p>
                    </div>
                  ) : null}

                  {selectedRequest.adminComment ? (
                    <div className="notice">Комментарий администратора: {selectedRequest.adminComment}</div>
                  ) : null}

                  {selectedRequest.status === 'pending' ? (
                    <>
                      <Field label="Комментарий при одобрении (опционально)">
                        <textarea
                          className="textarea"
                          rows={2}
                          value={approveComment}
                          onChange={(event) => setApproveComment(event.target.value)}
                          placeholder="Например: заполните профиль автора"
                        />
                      </Field>

                      <Field label="Причина отклонения">
                        <textarea
                          className="textarea"
                          rows={3}
                          value={rejectReason}
                          onChange={(event) => setRejectReason(event.target.value)}
                        />
                      </Field>

                      <div className="cluster">
                        <Button type="button" onClick={approve}>Одобрить</Button>
                        <Button type="button" variant="danger" onClick={reject}>Отклонить</Button>
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
