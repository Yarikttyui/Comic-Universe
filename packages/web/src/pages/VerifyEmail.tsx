import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RotateCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { resolvePostAuthRoute } from '../utils/authNavigation';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { pendingVerificationEmail, verifyEmail, isLoading, isAuthenticated } = useAuthStore();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!pendingVerificationEmail) {
      navigate('/register', { replace: true });
    }
  }, [pendingVerificationEmail, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = paste[i] || '';
    }
    setDigits(next);
    const focusIdx = Math.min(paste.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }
    try {
      await verifyEmail(pendingVerificationEmail!, code);
      const user = useAuthStore.getState().user;
      navigate(resolvePostAuthRoute(user, '/'), { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Неверный код');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendMsg('');
    try {
      await authApi.resendCode(pendingVerificationEmail!);
      setResendMsg('Код отправлен повторно');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось отправить код');
    }
  };

  if (!pendingVerificationEmail) return null;

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
              <ShieldCheck size={28} color="#fff" />
            </div>
            <h2>Подтверждение email</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem' }}>
              Мы отправили 6-значный код на<br />
              <strong style={{ color: 'var(--ink-normal)' }}>{pendingVerificationEmail}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            {error ? <div className="alert alert-error">{error}</div> : null}
            {resendMsg ? <div className="alert" style={{ background: 'var(--surface-raised)', color: 'var(--accent-strong)', border: '1px solid var(--accent-strong)', borderRadius: 8, padding: '10px 16px' }}>{resendMsg}</div> : null}

            <div style={{
              display: 'flex', gap: 10, justifyContent: 'center', margin: '8px 0',
            }} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  className="input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{
                    width: 52, height: 58, textAlign: 'center',
                    fontSize: '1.5rem', fontWeight: 700,
                    borderRadius: 12, padding: 0,
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              block
              size="lg"
              disabled={isLoading || digits.join('').length !== 6}
            >
              {isLoading ? 'Проверка...' : 'Подтвердить'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              style={{
                background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer',
                color: resendCooldown > 0 ? 'var(--ink-soft)' : 'var(--accent-strong)',
                fontWeight: 600, fontSize: '0.9rem',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <RotateCw size={14} />
              {resendCooldown > 0 ? `Повторно через ${resendCooldown}с` : 'Отправить код повторно'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
