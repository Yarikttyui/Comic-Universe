import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { resolvePostAuthRoute } from '../utils/authNavigation';

export default function Onboarding() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    completeRoleSelection,
    completeCreatorProfile,
    completeReaderOnboarding,
  } = useAuthStore();

  const [creatorNick, setCreatorNick] = useState('');
  const [avatarFileId, setAvatarFileId] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (user?.isOnboardingCompleted) {
      navigate(resolvePostAuthRoute(user, '/'), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const selectRole = async (role: 'reader' | 'creator') => {
    setError('');
    setIsLoading(true);
    try {
      await completeRoleSelection(role);
      if (role === 'reader') {
        await completeReaderOnboarding();
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось сохранить роль.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsLoading(true);
    try {
      const response = await uploadsApi.uploadFile(file, 'creator-avatar');
      const uploaded = response.data.data.file;
      setAvatarFileId(uploaded.id);
      setAvatarPreview(uploaded.publicUrl || file.name);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось загрузить аватар.');
    } finally {
      setIsLoading(false);
    }
  };

  const finishCreator = async () => {
    setError('');
    if (!creatorNick.trim()) {
      setError('Введите ник создателя.');
      return;
    }
    if (!avatarFileId) {
      setError('Загрузите файл аватара.');
      return;
    }

    setIsLoading(true);
    try {
      await completeCreatorProfile({
        creatorNick: creatorNick.trim(),
        avatarFileId,
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Не удалось завершить регистрацию.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const currentStep = user.onboardingStage === 'role_select' ? 2 : 3;

  return (
    <section className="page">
      <div className="container auth-wrap stack">
        <div className="stepper">
          <span className="step active" />
          <span className={`step ${currentStep >= 2 ? 'active' : ''}`} />
          <span className={`step ${currentStep >= 3 ? 'active' : ''}`} />
        </div>

        <Card>
          <div className="stack">
            <h1>Завершение регистрации</h1>
            <p className="page-subtitle">Шаг {currentStep} из 3.</p>

            {error ? <div className="alert alert-error">{error}</div> : null}

            {user.onboardingStage === 'role_select' && (
              <div className="stack">
                <strong>Выберите роль</strong>
                <div className="role-picker">
                  <button className="role-option" onClick={() => selectRole('reader')} disabled={isLoading}>
                    <strong>Читатель</strong>
                    <p className="page-subtitle">Библиотека, рейтинги, комментарии и загрузки.</p>
                  </button>
                  <button className="role-option" onClick={() => selectRole('creator')} disabled={isLoading}>
                    <strong>Создатель</strong>
                    <p className="page-subtitle">Студия, редактор ветвления и ревью релизов.</p>
                  </button>
                </div>
              </div>
            )}

            {user.onboardingStage === 'creator_profile' && (
              <div className="stack">
                <Field label="Ник создателя">
                  <input
                    className="input"
                    value={creatorNick}
                    onChange={(event) => setCreatorNick(event.target.value)}
                    placeholder="panel_master"
                  />
                </Field>

                <Field label="Аватар (файл)">
                  <input className="input" type="file" onChange={uploadAvatar} />
                  {avatarPreview ? <span className="field-hint">Загружен: {avatarPreview}</span> : null}
                </Field>

                <Button type="button" onClick={finishCreator} disabled={isLoading}>
                  {isLoading ? 'Сохранение...' : 'Завершить'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
