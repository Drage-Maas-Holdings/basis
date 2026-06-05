import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface MultiSelectProps {
  value: string[];
  onChange: (v: string[]) => void;
  options: readonly string[];
  placeholder?: string;
  label?: string;
  className?: string;
  maxChips?: number;
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  className = '',
  maxChips,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  const remove = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== opt));
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`} ref={ref}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      ) : null}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full min-h-[38px] flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-lg border border-border bg-bg-surface text-left focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-colors"
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 min-h-[24px]">
            {value.length === 0 ? (
              <span className="px-1 text-text-muted">{placeholder}</span>
            ) : (
              <>
                {value.slice(0, maxChips ?? value.length).map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-xs"
                  >
                    {v}
                    <button
                      type="button"
                      onClick={(e) => remove(v, e)}
                      className="hover:bg-brand-blue/20 rounded-sm"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {maxChips && value.length > maxChips ? (
                  <span className="text-xs text-text-muted">
                    +{value.length - maxChips} more
                  </span>
                ) : null}
              </>
            )}
          </div>
          <ChevronDown
            size={16}
            className={`text-text-secondary transition-transform shrink-0 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
        {open ? (
          <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-border bg-bg-surface shadow-card">
            {options.map((o) => {
              const isActive = value.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(o)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    isActive
                      ? 'bg-brand-blue/10 text-brand-blue'
                      : 'text-text-primary hover:bg-bg-surface-2'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isActive
                        ? 'bg-brand-blue border-brand-blue text-white'
                        : 'border-border'
                    }`}
                  >
                    {isActive ? <Check size={12} /> : null}
                  </span>
                  <span>{o}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
