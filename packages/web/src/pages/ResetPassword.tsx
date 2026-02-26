import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, AlertTriangle } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Ссылка для сброса пароля недействительна');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword({
        token: token!,
        newPassword,
        confirmPassword,
      });

      const { user, tokens } = response.data.data;
      const store = useAuthStore.getState();
      store.setTokens(tokens);
      useAuthStore.setState({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role === 'author' ? 'creator' : user.role,
          creatorNick: user.creatorNick ?? null,
          onboardingStage: 'done',
          isOnboardingCompleted: true,
          nextAction: null,
        },
        isAuthenticated: true,
      });

      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось сбросить пароль');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ maxWidth: '480px' }}>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <AlertTriangle size={28} color="#fff" />
            </div>
            <h2>Недействительная ссылка</h2>
            <p style={{ color: 'var(--ink-soft)', marginTop: 8 }}>
              Ссылка для сброса пароля повреждена или отсутствует токен.
            </p>
            <div style={{ marginTop: 24 }}>
              <Link to="/forgot-password" style={{
                fontWeight: 600, color: 'var(--accent-strong)', textDecoration: 'none',
              }}>
                Запросить новую ссылку
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '480px' }}>
        <div className="auth-card">
          <div className="auth-title" style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-strong), var(--accent-hue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <KeyRound size={28} color="#fff" />
            </div>
            <h2>Новый пароль</h2>
            <p style={{ color: 'var(--ink-soft)' }}>Введите новый пароль для вашего аккаунта</p>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            {error ? <div className="alert alert-error">{error}</div> : null}

            <Field label="Новый пароль">
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                autoComplete="new-password"
                autoFocus
              />
            </Field>

            <Field label="Повтор пароля">
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                autoComplete="new-password"
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              block
              size="lg"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить пароль'}
            </Button>
          </form>

          <div className="auth-footer">
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontWeight: 600, color: 'var(--accent-strong)', textDecoration: 'none',
            }}>
              <ArrowLeft size={16} /> Назад ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
