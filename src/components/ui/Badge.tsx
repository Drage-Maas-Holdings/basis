import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'default'
  | 'brand-blue'
  | 'brand-teal'
  | 'brand-orange'
  | 'brand-navy'
  | 'win'
  | 'loss'
  | 'pending'
  | 'info'
  | 'indigo'
  | 'amber'
  | 'orange'
  | 'purple'
  | 'pink'
  | 'grey';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-bg-surface-2 text-text-secondary',
  'brand-blue': 'bg-brand-blue/10 text-brand-blue',
  'brand-teal': 'bg-brand-teal/10 text-brand-teal',
  'brand-orange': 'bg-brand-orange/10 text-brand-orange',
  'brand-navy': 'bg-brand-navy/10 text-brand-navy',
  win: 'bg-win-bg text-win-text',
  loss: 'bg-loss-bg text-loss-text',
  pending: 'bg-pending-bg text-pending-text',
  info: 'bg-[#E3F2FD] text-[#1565C0] dark:bg-[#1A2A3A] dark:text-[#7AB8F0]',
  indigo:
    'bg-[#E8EAF6] text-[#3949AB] dark:bg-[#1E2340] dark:text-[#9FA8DA]',
  amber:
    'bg-[#FFF9C4] text-[#6B5B00] dark:bg-[#3A3200] dark:text-[#FFE066]',
  orange:
    'bg-[#FFF3E0] text-[#E07B39] dark:bg-[#3A2000] dark:text-[#F4924A]',
  purple:
    'bg-[#F3E5F5] text-[#7B1FA2] dark:bg-[#2A1A3A] dark:text-[#CE93D8]',
  pink: 'bg-[#FCE4EC] text-[#C2185B] dark:bg-[#3A1020] dark:text-[#F48FB1]',
  grey: 'bg-[#ECEFF1] text-[#546E7A] dark:bg-[#1A1E22] dark:text-[#90A4AE]',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({
  variant = 'default',
  children,
  className = '',
  size = 'md',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-md ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      } ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
