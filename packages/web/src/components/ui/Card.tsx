import clsx from 'clsx';
import type { ReactNode } from 'react';

type CardTone = 'default' | 'muted' | 'accent';

interface CardProps {
  children: ReactNode;
  className?: string;
  tone?: CardTone;
}

export function Card({ children, className, tone = 'default' }: CardProps) {
  return <div className={clsx('card', `card-${tone}`, className)}>{children}</div>;
}
