export function ProgressPill({ reached }: { reached: number }) {
  const total = 100;
  const pct = Math.min(100, Math.round((reached / total) * 100));
  const color =
    pct < 40
      ? 'bg-loss-bg text-loss-text'
      : pct < 70
        ? 'bg-pending-bg text-pending-text'
        : 'bg-win-bg text-win-text';
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}
      title={`${pct}% of 100 prospects reached`}
    >
      <span className="font-mono">
        {reached} / {total}
      </span>
      <span className="opacity-70">prospects reached</span>
    </span>
  );
}
