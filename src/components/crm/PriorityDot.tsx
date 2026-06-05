import type { Priority } from '../../types';

export function PriorityDot({ priority }: { priority: Priority }) {
  const color =
    priority === 'High'
      ? 'bg-loss-text'
      : priority === 'Medium'
        ? 'bg-pending-text'
        : 'bg-win-text';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-text-secondary">{priority}</span>
    </span>
  );
}
