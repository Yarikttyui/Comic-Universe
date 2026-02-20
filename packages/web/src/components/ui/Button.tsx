import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type To } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseButtonProps {}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  className,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx('btn', `btn-${variant}`, `btn-${size}`, block && 'btn-block', className)}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}

interface LinkButtonProps extends BaseButtonProps {
  to: To;
  children: ReactNode;
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  block,
  className,
  leftIcon,
  rightIcon,
  children,
}: LinkButtonProps) {
  return (
    <Link className={clsx('btn', `btn-${variant}`, `btn-${size}`, block && 'btn-block', className)} to={to}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
