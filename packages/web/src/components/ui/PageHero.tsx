import type { ReactNode } from 'react';

interface PageHeroProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  aside?: ReactNode;
}

export function PageHero({ kicker, title, subtitle, actions, aside }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="page-hero-main">
        {kicker ? <span className="hero-kicker">{kicker}</span> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="hero-subtitle">{subtitle}</p> : null}
        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>
      {aside ? <aside className="page-hero-aside">{aside}</aside> : null}
    </section>
  );
}
