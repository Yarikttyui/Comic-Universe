import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { resolvePostAuthRoute } from '../utils/authNavigation';

const NICK_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    nick: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!formData.email || !formData.nick || !formData.password || !formData.confirmPassword) {
      setError('Заполните все поля.');
      return;
    }

    if (!NICK_PATTERN.test(formData.nick.trim())) {
      setError('Ник: 3-30 символов, только буквы, цифры и _.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    try {
      await register({
        email: formData.email.trim().toLowerCase(),
        nick: formData.nick.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      const store = useAuthStore.getState();
      if (store.pendingVerificationEmail) {
        navigate('/verify-email', { replace: true });
        return;
      }

      const user = store.user;
      navigate(resolvePostAuthRoute(user, '/'), { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Ошибка регистрации.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '520px' }}>
        <div className="auth-card">
          <div className="auth-title">
            <h2>Создать аккаунт</h2>
            <p style={{ color: 'var(--ink-soft)' }}>
              Регистрация доступна только как читатель. Статус создателя выдается по заявке и одобряется админом.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            {error ? <div className="alert alert-error">{error}</div> : null}

            <Field label="Email">
              <input
                className="input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="neo@matrix.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Ник">
              <input
                className="input"
                value={formData.nick}
                onChange={(e) => setFormData({ ...formData, nick: e.target.value })}
                placeholder="night_reader"
                autoComplete="nickname"
              />
            </Field>

            <Field label="Пароль">
              <input
                className="input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <Field label="Повтор пароля">
              <input
                className="input"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              block
              size="lg"
              disabled={isLoading}
              rightIcon={<ArrowRight size={18} />}
            >
              {isLoading ? 'Создаем...' : 'Зарегистрироваться'}
            </Button>
          </form>

          <div className="auth-footer">
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--accent-strong)' }}>
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
