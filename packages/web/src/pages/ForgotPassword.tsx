import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { Button } from '../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ maxWidth: '480px' }}>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle size={28} color="#fff" />
            </div>
            <h2 style={{ marginBottom: 8 }}>Проверьте почту</h2>
            <p style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Если аккаунт с адресом <strong style={{ color: 'var(--ink-normal)' }}>{email}</strong> существует,
              мы отправили письмо со ссылкой для сброса пароля.
            </p>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginTop: 12 }}>
              Письмо может прийти в течение нескольких минут. Проверьте папку «Спам».
            </p>
            <div style={{ marginTop: 24 }}>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontWeight: 600, color: 'var(--accent-strong)', textDecoration: 'none',
              }}>
                <ArrowLeft size={16} /> Вернуться ко входу
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
              <Mail size={28} color="#fff" />
            </div>
            <h2>Сброс пароля</h2>
            <p style={{ color: 'var(--ink-soft)' }}>
              Введите email, привязанный к вашему аккаунту
            </p>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            {error ? <div className="alert alert-error">{error}</div> : null}

            <div>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              block
              size="lg"
              disabled={loading}
            >
              {loading ? 'Отправка...' : 'Отправить ссылку'}
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
