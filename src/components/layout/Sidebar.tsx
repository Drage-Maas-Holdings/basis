import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trading', label: 'Trading Journal', icon: TrendingUp },
  { to: '/crm', label: 'IT Services CRM', icon: Users },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const width = expanded ? 'w-[220px]' : 'w-[64px]';
  const location = useLocation();

  return (
    <aside
      className={`${width} shrink-0 bg-bg-surface border-r border-border flex flex-col transition-[width] duration-200`}
    >
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center text-white font-display text-lg shrink-0">
          百
        </div>
        {expanded ? (
          <span className="ml-2 font-display font-semibold text-lg text-text-primary tracking-tight">
            Hyaku
          </span>
        ) : null}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-blue text-white font-medium'
                  : 'text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary'
              }`}
              title={!expanded ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {expanded ? <span className="truncate">{label}</span> : null}
            </NavLink>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="m-2 p-2 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary"
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}
