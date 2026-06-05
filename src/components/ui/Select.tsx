import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[] | readonly string[];
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

function normalize(opts: SelectOption[] | readonly string[]): SelectOption[] {
  if (opts.length === 0) return [];
  if (typeof opts[0] === 'string') {
    return (opts as readonly string[]).map((v) => ({ value: v, label: v }));
  }
  return opts as SelectOption[];
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  error,
  className = '',
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const opts = normalize(options);
  const current = opts.find((o) => o.value === value);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`} ref={ref}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      ) : null}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border bg-bg-surface text-left focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-colors disabled:opacity-50 ${
            error ? 'border-loss-text' : 'border-border'
          }`}
        >
          <span className={current ? 'text-text-primary' : 'text-text-muted'}>
            {current ? current.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-text-secondary transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
        {open ? (
          <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-border bg-bg-surface shadow-card">
            {opts.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-muted">
                No options
              </div>
            ) : (
              opts.map((o) => {
                const isActive = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                      isActive
                        ? 'bg-brand-blue/10 text-brand-blue'
                        : 'text-text-primary hover:bg-bg-surface-2'
                    }`}
                  >
                    <span>{o.label}</span>
                    {isActive ? <Check size={14} /> : null}
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
      {error ? <span className="text-xs text-loss-text">{error}</span> : null}
    </div>
  );
}
