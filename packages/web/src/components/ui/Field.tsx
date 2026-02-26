import clsx from 'clsx';
import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}

export function Field({ label, children, error, hint, className }: FieldProps) {
  return (
    <label className={clsx('field', className)}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
