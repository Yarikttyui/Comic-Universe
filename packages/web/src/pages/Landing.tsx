import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Smartphone, Layers } from 'lucide-react';
import { useComicsStore } from '../store/comicsStore';
import { useAuthStore } from '../store/authStore';
import { comicsApi } from '../services/api';
import { LinkButton } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Tag } from '../components/ui/Tag';
import { EmptyState } from '../components/ui/EmptyState';
import ElectricBorder from '../components/ui/ElectricBorder';
import '../styles/electric-border.css';

interface StatsState {
  totalComics: number;
  totalReaders: number;
  totalPages: number;
  totalPaths: number;
}

export default function Landing() {
  const navigate = useNavigate();
  const { featuredComics, fetchFeatured } = useComicsStore();
  const { user, isAuthenticated } = useAuthStore();
  const becomeAuthorHref = isAuthenticated && user?.role === 'reader' ? '/profile' : '/register';
  const becomeAuthorLabel = isAuthenticated && user?.role === 'reader' ? 'Подать заявку автора' : 'Стать автором';
  const [stats, setStats] = useState<StatsState>({
    totalComics: 0,
    totalReaders: 0,
    totalPages: 0,
    totalPaths: 0,
  });

  useEffect(() => {
    fetchFeatured();
    comicsApi
      .getStats()
      .then((response) => setStats(response.data.data))
      .catch(() => undefined);
  }, [fetchFeatured]);

  return (
    <section>
      <div className="container">
        <div className="landing-hero">
          <h1 className="landing-title">
            Твоя история<br /><span style={{ color: 'var(--ink-soft)' }}>Твои решения</span>
          </h1>
          <p className="landing-subtitle">
            Comic Universe — это платформа интерактивных комиксов с сюжетом.
            Создавайте свои истории, где каждый выбор меняет ход событий.
          </p>
          <div className="landing-actions">
            <LinkButton to="/library" variant="primary" size="lg">
              Начать читать
            </LinkButton>
            {(!isAuthenticated || user?.role === 'reader') && (
              <LinkButton to={becomeAuthorHref} variant="outline" size="lg">
                {becomeAuthorLabel}
              </LinkButton>
            )}
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: '6rem' }}>
          <div className="kpi-card">
            <div className="kpi-value">{stats.totalComics}+</div>
            <div className="kpi-label">Комиксов</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{stats.totalReaders}+</div>
            <div className="kpi-label">Читателей</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{stats.totalPages}+</div>
            <div className="kpi-label">Сцен</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{stats.totalPaths}+</div>
            <div className="kpi-label">Вариантов сюжета</div>
          </div>
        </div>

        <SectionHeader title="Почему Comic Universe?" align="center" />
        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon"><Zap size={24} /></div>
            <div className="feature-text">
              <div className="feature-title">Живой сюжет</div>
              <p className="feature-desc">
                Каждый комикс — это история, которая реагирует на ваши действия. Никаких рельсов, только ваш путь.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Layers size={24} /></div>
            <div className="feature-text">
              <div className="feature-title">Выбор за вами</div>
              <p className="feature-desc">
                В каждом комиксе вы принимаете решения, которые ведут к разным концовкам. Можно перечитывать и открывать новые сюжеты.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Smartphone size={24} /></div>
            <div className="feature-text">
              <div className="feature-title">Удобно везде</div>
              <p className="feature-desc">
                Читайте на телефоне, планшете или компьютере — интерфейс подстраивается под любой экран.
              </p>
            </div>
          </div>
        </div>

        <SectionHeader
          title="Популярные сейчас"
          align="center"
        />

        {featuredComics.length === 0 ? (
          <EmptyState title="Скоро здесь появятся лучшие истории" description="Станьте одним из первых авторов!" />
        ) : (
          <div className="popular-grid">
            {(() => {
              const top3 = featuredComics.slice(0, 3);
              const ordered = top3.length >= 3
                ? [top3[1], top3[0], top3[2]]
                : top3;
              const ranks = top3.length >= 3 ? [2, 1, 3] : top3.map((_, i) => i + 1);
              return ordered.map((comic, index) => (
                <ElectricBorder key={comic.id} color="var(--accent)" speed={0.6} chaos={0.01} borderRadius={16}>
                  <button className={`popular-card ${index === 1 ? 'popular-card--hero' : ''}`} type="button" onClick={() => navigate(`/comic/${comic.id}`)}>
                    <div className="popular-rank">#{ranks[index]}</div>
                    <div className="popular-cover">{comic.coverImage ? <img src={comic.coverImage} alt={comic.title} /> : null}</div>
                    <div className="popular-body stack" style={{ gap: '0.5rem' }}>
                      <div className="comic-title">{comic.title}</div>
                      <div className="comic-desc">{comic.description}</div>
                      <div className="cluster">
                        <Tag tone="soft">{comic.readCount} чтений</Tag>
                        <Tag>Рейтинг {comic.rating.toFixed(1)}</Tag>
                      </div>
                    </div>
                  </button>
                </ElectricBorder>
              ));
            })()}
          </div>
        )}
      </div>
    </section>
  );
}
