import clsx from 'clsx';
import type { ReactNode } from 'react';

interface TagProps {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'accent' | 'soft';
}

export function Tag({ children, className, tone = 'default' }: TagProps) {
  return <span className={clsx('tag', `tag-${tone}`, className)}>{children}</span>;
}
