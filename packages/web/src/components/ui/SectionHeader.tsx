import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  align?: 'left' | 'center';
}

export function SectionHeader({ title, subtitle, actions, align = 'left' }: SectionHeaderProps) {
  const style = align === 'center' ? { textAlign: 'center' as const, justifyContent: 'center' } : undefined;
  return (
    <div className="section-header" style={style}>
      <div style={align === 'center' ? { textAlign: 'center' } : undefined}>
        <h2>{title}</h2>
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </div>
  );
}
