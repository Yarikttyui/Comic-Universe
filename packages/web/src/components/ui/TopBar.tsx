import type { ReactNode } from 'react';

interface TopBarProps {
  brand: ReactNode;
  nav: ReactNode;
  actions: ReactNode;
}

export function TopBar({ brand, nav, actions }: TopBarProps) {
  return (
    <div className="container topbar">
      {brand}
      {nav}
      <div className="topbar-actions">{actions}</div>
    </div>
  );
}
