import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
}

export function IconAction({ icon, label, className, ...props }: IconActionProps) {
  return (
    <button className={clsx('icon-action', className)} aria-label={label} type="button" {...props}>
      {icon}
    </button>
  );
}
