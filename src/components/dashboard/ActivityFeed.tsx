import { Card, CardHeader } from '../ui/Card';
import type { ActivityItem } from '../../types';
import { formatTimeAgo } from '../../lib/formatters';

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader
        title="Recent Activity"
        subtitle="Last 10 actions across both modules"
      />
      {items.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-muted">
          No activity yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((a) => {
            const isTrade = a.source === 'trade';
            return (
              <li
                key={a.id}
                className={`flex items-center gap-3 py-2.5 pl-3 border-l-4 ${
                  isTrade ? 'border-brand-blue' : 'border-brand-orange'
                }`}
              >
                <span
                  className={`text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    isTrade
                      ? 'bg-brand-blue/10 text-brand-blue'
                      : 'bg-brand-orange/10 text-brand-orange'
                  }`}
                >
                  {isTrade ? 'Trade' : 'CRM'}
                </span>
                <span className="flex-1 text-sm text-text-primary truncate">
                  {a.description}
                </span>
                <span className="text-xs text-text-muted shrink-0">
                  {formatTimeAgo(a.created_at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
