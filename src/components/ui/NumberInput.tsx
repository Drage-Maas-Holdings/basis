import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  step?: number;
  min?: number;
  max?: number;
  value: number | '';
  onValueChange: (n: number | '') => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    { label, error, hint, step = 0.01, min, max, value, onValueChange, className = '', id, ...rest },
    ref,
  ) => {
    const inputId = id ?? `num-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className="flex flex-col gap-1 w-full">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-secondary"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') {
              onValueChange('');
            } else {
              const n = Number(v);
              if (!isNaN(n)) onValueChange(n);
            }
          }}
          className={`w-full px-3 py-2 text-sm font-mono rounded-lg border bg-bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-colors ${
            error ? 'border-loss-text' : 'border-border'
          } ${className}`}
          {...rest}
        />
        {error ? (
          <span className="text-xs text-loss-text">{error}</span>
        ) : hint ? (
          <span className="text-xs text-text-muted">{hint}</span>
        ) : null}
      </div>
    );
  },
);
NumberInput.displayName = 'NumberInput';
