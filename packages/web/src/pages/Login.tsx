import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { resolvePostAuthRoute } from '../utils/authNavigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login, isLoading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      await login(email.trim(), password);
      const loggedUser = useAuthStore.getState().user;
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(resolvePostAuthRoute(loggedUser, from), { replace: true });
    } catch (err: any) {
      if (err?.needsVerification) {
        navigate('/verify-email', { replace: true });
        return;
      }
      setError(err?.response?.data?.error?.message || 'Неверный email или пароль.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-title">
            <h2>С возвращением</h2>
            <p style={{ color: 'var(--ink-soft)' }}>Войдите, чтобы продолжить</p>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            {error ? <div className="alert alert-error">{error}</div> : null}

            <Field label="Email" error={undefined}>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                autoComplete="username"
              />
            </Field>

            <Field label="Пароль" error={undefined}>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>

            <div style={{ textAlign: 'right', marginTop: -4 }}>
              <Link to="/forgot-password" style={{
                fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--accent-strong)', textDecoration: 'none',
              }}>
                Забыли пароль?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              block
              size="lg"
              disabled={isLoading}
              rightIcon={<ArrowRight size={18} />}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="auth-footer">
            Нет аккаунта?{' '}
            <Link to="/register" style={{ fontWeight: 600, color: 'var(--accent-strong)' }}>
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
