import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Tag } from '../components/ui/Tag';
import { EmptyState } from '../components/ui/EmptyState';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  creatorNick: string | null;
  role: string;
  accountStatus: string;
  bannedUntil: string | null;
  banReason: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  reader: 'Читатель',
  creator: 'Создатель',
  admin: 'Администратор',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [banModal, setBanModal] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDays, setBanDays] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getUsers();
      setUsers(response.data.data.users);
    } catch {
      setError('Не удалось загрузить пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleBan = async () => {
    if (!banModal || !banReason.trim()) return;
    setActionLoading(true);
    try {
      const days = banDays ? parseInt(banDays, 10) : undefined;
      await adminApi.banUser(banModal.id, banReason.trim(), days);
      setBanModal(null);
      setBanReason('');
      setBanDays('');
      await loadUsers();
    } catch {
      setError('Не удалось заблокировать пользователя');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (userId: string) => {
    setActionLoading(true);
    try {
      await adminApi.unbanUser(userId);
      await loadUsers();
    } catch {
      setError('Не удалось разблокировать пользователя');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await adminApi.deleteUser(deleteConfirm.id);
      setDeleteConfirm(null);
      await loadUsers();
    } catch {
      setError('Не удалось удалить пользователя');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setRoleLoading(userId);
    try {
      await adminApi.changeRole(userId, newRole);
      await loadUsers();
    } catch {
      setError('Не удалось изменить роль');
    } finally {
      setRoleLoading(null);
    }
  };

  if (isLoading) {
    return (
      <section className="page">
        <div className="container notice">Загрузка пользователей...</div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="container stack">
        <h2>Управление пользователями</h2>

        {error && <div className="notice notice--danger">{error}</div>}

        {users.length === 0 ? (
          <EmptyState title="Нет пользователей" />
        ) : (
          <div className="stack">
            {users.map((u) => (
              <Card key={u.id}>
                <div className="card-body" style={{ padding: '1rem' }}>
                  <div className="row-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong>{u.displayName}</strong>
                      {u.creatorNick && <span style={{ opacity: 0.6 }}> @{u.creatorNick}</span>}
                      <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{u.email}</div>
                    </div>
                    <div className="cluster" style={{ alignItems: 'center' }}>
                      {u.role !== 'admin' ? (
                        <select
                          className="input"
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          disabled={roleLoading === u.id || actionLoading}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: 'auto', minWidth: '140px' }}
                        >
                          <option value="reader">Читатель</option>
                          <option value="creator">Создатель</option>
                        </select>
                      ) : (
                        <Tag>{ROLE_LABELS[u.role]}</Tag>
                      )}
                      {u.accountStatus === 'banned' && <Tag tone="accent">Заблокирован</Tag>}
                    </div>
                  </div>

                  {u.accountStatus === 'banned' && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--danger-bg, rgba(220,50,50,0.1))', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <div><strong>Причина:</strong> {u.banReason || '—'}</div>
                      <div><strong>До:</strong> {u.bannedUntil ? new Date(u.bannedUntil).toLocaleDateString('ru-RU') : 'Бессрочно'}</div>
                    </div>
                  )}

                  {u.role !== 'admin' && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      {u.accountStatus === 'banned' ? (
                        <Button size="sm" variant="outline" onClick={() => handleUnban(u.id)} disabled={actionLoading}>
                          Разблокировать
                        </Button>
                      ) : (
                        <Button size="sm" variant="danger" onClick={() => { setBanModal(u); setBanReason(''); setBanDays(''); }} disabled={actionLoading}>
                          Заблокировать
                        </Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(u)} disabled={actionLoading}>
                        Удалить
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {banModal && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ maxWidth: '420px', width: '90%' }}>
              <div className="card-body" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Блокировка: {banModal.displayName}</h3>
                <Field label="Причина блокировки">
                  <textarea
                    className="input"
                    rows={3}
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Укажите причину..."
                  />
                </Field>
                <Field label="Срок (дней, пусто = бессрочно)">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={banDays}
                    onChange={(e) => setBanDays(e.target.value)}
                    placeholder="Бессрочно"
                  />
                </Field>
                <div className="cluster" style={{ marginTop: '1rem' }}>
                  <Button variant="danger" onClick={handleBan} disabled={!banReason.trim() || actionLoading}>
                    Заблокировать
                  </Button>
                  <Button variant="ghost" onClick={() => setBanModal(null)}>Отмена</Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {deleteConfirm && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ maxWidth: '420px', width: '90%' }}>
              <div className="card-body" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Удаление пользователя</h3>
                <p style={{ marginBottom: '1rem' }}>
                  Вы уверены, что хотите удалить пользователя <strong>{deleteConfirm.displayName}</strong> ({deleteConfirm.email})? Это действие необратимо. Все данные пользователя будут удалены.
                </p>
                <div className="cluster" style={{ marginTop: '1rem' }}>
                  <Button variant="danger" onClick={handleDelete} disabled={actionLoading}>
                    Удалить навсегда
                  </Button>
                  <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
