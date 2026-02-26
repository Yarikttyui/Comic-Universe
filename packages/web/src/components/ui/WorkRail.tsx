import { NavLink } from 'react-router-dom';
import { GripVertical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface RailItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface WorkRailProps {
  items: RailItem[];
  onHeaderPointerDown?: React.PointerEventHandler<HTMLDivElement>;
}

export function WorkRail({
  items,
  onHeaderPointerDown,
}: WorkRailProps) {
  return (
    <>
      <div className="work-rail-header" onPointerDown={onHeaderPointerDown}>
        <GripVertical size={14} className="work-rail-grip" />
        <span className="work-rail-title">Рабочая зона</span>
      </div>

      <nav className="work-rail-nav" aria-label="Навигация рабочей зоны">
        {items.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `work-rail-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
