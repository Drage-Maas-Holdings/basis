export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-block w-5 h-5 border-2 border-text-muted border-t-brand-blue rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner className="w-8 h-8" />
      {label ? <span className="text-sm text-text-secondary">{label}</span> : null}
    </div>
  );
}
