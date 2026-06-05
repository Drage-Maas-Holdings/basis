import type { ReactNode } from 'react';

type Accent = 'brand-blue' | 'brand-teal' | 'brand-navy' | 'brand-orange';

const accentBg: Record<Accent, string> = {
  'brand-blue': 'from-brand-blue/15 to-brand-blue/0',
  'brand-teal': 'from-brand-teal/15 to-brand-teal/0',
  'brand-navy': 'from-brand-navy/15 to-brand-navy/0',
  'brand-orange': 'from-brand-orange/15 to-brand-orange/0',
};

const accentText: Record<Accent, string> = {
  'brand-blue': 'text-brand-blue',
  'brand-teal': 'text-brand-teal',
  'brand-navy': 'text-brand-navy',
  'brand-orange': 'text-brand-orange',
};

export interface KPICardProps {
  category: 'TRADING' | 'CRM';
  label: string;
  value: ReactNode;
  accent?: Accent;
  sub?: ReactNode;
}

export function KPICard({
  category,
  label,
  value,
  accent = 'brand-blue',
  sub,
}: KPICardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-bg-surface shadow-card p-4">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accentBg[accent]} pointer-events-none`}
      />
      <div className="relative flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
          {category}
        </span>
        <span className="text-[11px] text-text-secondary uppercase tracking-wide">
          {label}
        </span>
        <span
          className={`font-mono text-[28px] leading-none font-semibold ${accentText[accent]}`}
        >
          {value}
        </span>
        {sub ? (
          <span className="text-xs text-text-muted">{sub}</span>
        ) : null}
      </div>
    </div>
  );
}
