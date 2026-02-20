import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Tag } from '../components/ui/Tag';
import { EmptyState } from '../components/ui/EmptyState';

interface UserStats {
  comicsRead: number;
  totalChoicesMade: number;
  endingsUnlocked: number;
  readingTimeMinutes: number;
}

interface CreatorRequest {
  id: string;
  desiredNick: string;
  motivation?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  adminComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  reader: 'Читатель',
  creator: 'Создатель',
  admin: 'Администратор',
};

const CREATOR_NICK_PATTERN = /^[a-zA-Z0-9_]{3,50}$/;

export default function Profile() {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [stats, setStats] = useState<UserStats>({
    comicsRead: 0,
    totalChoicesMade: 0,
    endingsUnlocked: 0,
    readingTimeMinutes: 0,
  });
  const [creatorRequest, setCreatorRequest] = useState<CreatorRequest | null>(null);
  const [desiredCreatorNick, setDesiredCreatorNick] = useState('');
  const [requestMotivation, setRequestMotivation] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const loadProfile = async () => {
    const [profileResponse, statsResponse, requestResponse] = await Promise.all([
      usersApi.getProfile(),
      usersApi.getStats(),
      usersApi.getCreatorRequest(),
    ]);

    const profileUser = profileResponse.data.data.user;
    setDisplayName(profileUser.displayName || '');
    setBio(profileUser.bio || '');
    setAvatar(profileUser.avatar || '');
    setStats(statsResponse.data.data.stats || statsResponse.data.data);

    const latestRequest = requestResponse.data.data.request || null;
    setCreatorRequest(latestRequest);

    if (latestRequest?.desiredNick) {
      setDesiredCreatorNick(latestRequest.desiredNick);
    }

    if (profileUser.role && profileUser.role !== user?.role) {
      await checkAuth();
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    loadProfile().catch(() => undefined);
  }, [isAuthenticated, loadProfile]);

  if (!isAuthenticated || !user) {
    return (
      <section className="page">
        <div className="container"><EmptyState title="Нужен вход" description="Войдите в аккаунт, чтобы открыть профиль." /></div>
      </section>
    );
  }

  const handleSave = async () => {
    setError('');
    setInfo('');

    try {
      await usersApi.updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim(),
      });
      await checkAuth();
      setInfo('Профиль обновлён.');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось сохранить профиль.');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setInfo('');

    try {
      const response = await usersApi.uploadAvatar(file);
      setAvatar(response.data.data.avatar);
      setInfo('Аватар обновлён.');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить аватар.');
    }
  };

  const submitCreatorRequest = async () => {
    setError('');
    setInfo('');

    const nick = desiredCreatorNick.trim();
    if (!CREATOR_NICK_PATTERN.test(nick)) {
      setError('Ник создателя: 3-50 символов, только буквы, цифры и _.');
      return;
    }

    try {
      await usersApi.createCreatorRequest({
        desiredNick: nick,
        motivation: requestMotivation.trim() || undefined,
      });
      await loadProfile();
      setInfo('Заявка отправлена и ожидает решения администратора.');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось отправить заявку.');
    }
  };

  const initials = (displayName || user.email || '?').charAt(0).toUpperCase();

  const resolveAvatarUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const apiBase = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/api\/v1$/, '');
    const backendHost = apiBase || `${window.location.protocol}//${window.location.hostname}:3001`;
    return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const avatarUrl = resolveAvatarUrl(avatar);

  return (
    <section className="page">
      <div className="container stack">
        <h1>Профиль</h1>

        <div className="grid-2">
          <Card>
            <div className="stack" style={{ alignItems: 'center' }}>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: avatarUrl ? 'transparent' : 'var(--accent-soft)',
                color: 'var(--accent-strong)',
                fontSize: '2.5rem',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  initials
                )}
              </div>

              <div className="cluster">
                <Tag tone="accent">{ROLE_LABELS[user.role] || user.role}</Tag>
                {user.role === 'creator' && user.creatorNick ? <Tag>@{user.creatorNick}</Tag> : null}
              </div>

              <Field label="Ник">
                <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </Field>

              <Field label="Сменить аватар">
                <input className="input" type="file" accept="image/*" onChange={handleAvatarUpload} />
              </Field>

              <Field label="О себе">
                <textarea className="textarea" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
              </Field>

              <div className="cluster">
                <Button type="button" onClick={handleSave}>Сохранить</Button>
                <Button type="button" variant="ghost" onClick={logout}>Выйти</Button>
              </div>

              {error ? <div className="alert alert-error">{error}</div> : null}
              {info ? <div className="alert alert-success">{info}</div> : null}
            </div>
          </Card>

          <Card>
            <div className="stack">
              <strong>Статистика</strong>
              <div className="grid-2">
                <div className="kpi-card"><div className="kpi-value">{stats.comicsRead}</div><div className="kpi-label">прочитано</div></div>
                <div className="kpi-card"><div className="kpi-value">{stats.endingsUnlocked}</div><div className="kpi-label">концовок</div></div>
                <div className="kpi-card"><div className="kpi-value">{stats.totalChoicesMade}</div><div className="kpi-label">выборов</div></div>
                <div className="kpi-card"><div className="kpi-value">{stats.readingTimeMinutes}</div><div className="kpi-label">минут</div></div>
              </div>

              {(user.role === 'creator' || user.role === 'admin') && (
                <Link className="btn btn-outline btn-md" to="/creator/studio">Открыть студию</Link>
              )}
              {user.role === 'admin' && (
                <>
                  <Link className="btn btn-outline btn-md" to="/admin/reviews">Очередь ревью</Link>
                  <Link className="btn btn-outline btn-md" to="/admin/comments">Жалобы</Link>
                  <Link className="btn btn-outline btn-md" to="/admin/creator-requests">Заявки создателей</Link>
                </>
              )}
            </div>
          </Card>
        </div>

        {user.role === 'reader' ? (
          <Card>
            <div className="stack">
              <strong>Заявка на роль создателя</strong>
              <p className="page-subtitle">
                Чтобы получить доступ к студии, отправьте заявку. После одобрения админом аккаунт станет создателем.
              </p>

              {creatorRequest ? (
                <div className="stack">
                  <div className="cluster">
                    <Tag tone="soft">Ник: @{creatorRequest.desiredNick}</Tag>
                    <Tag tone={creatorRequest.status === 'approved' ? 'accent' : 'soft'}>
                      {creatorRequest.status === 'pending' ? 'На рассмотрении' : null}
                      {creatorRequest.status === 'approved' ? 'Одобрено' : null}
                      {creatorRequest.status === 'rejected' ? 'Отклонено' : null}
                      {creatorRequest.status === 'cancelled' ? 'Закрыто' : null}
                    </Tag>
                  </div>
                  {creatorRequest.adminComment ? (
                    <div className="notice">Комментарий админа: {creatorRequest.adminComment}</div>
                  ) : null}
                </div>
              ) : (
                <div className="notice">У вас пока нет заявки.</div>
              )}

              {creatorRequest?.status !== 'pending' ? (
                <>
                  <Field label="Желаемый ник создателя">
                    <input
                      className="input"
                      value={desiredCreatorNick}
                      onChange={(event) => setDesiredCreatorNick(event.target.value)}
                      placeholder="my_creator_nick"
                    />
                  </Field>

                  <Field label="Комментарий к заявке (опционально)">
                    <textarea
                      className="textarea"
                      rows={3}
                      value={requestMotivation}
                      onChange={(event) => setRequestMotivation(event.target.value)}
                      placeholder="Коротко опишите, что хотите публиковать"
                    />
                  </Field>

                  <div className="cluster">
                    <Button type="button" onClick={submitCreatorRequest}>Отправить заявку</Button>
                    <Button type="button" variant="ghost" onClick={() => loadProfile().catch(() => undefined)}>Обновить статус</Button>
                  </div>
                </>
              ) : (
                <Button type="button" variant="ghost" onClick={() => loadProfile().catch(() => undefined)}>
                  Обновить статус
                </Button>
              )}
            </div>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
