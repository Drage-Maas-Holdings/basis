import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...rest }, ref) => {
    const inputId = id ?? `inp-${Math.random().toString(36).slice(2, 9)}`;
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
          className={`w-full px-3 py-2 text-sm rounded-lg border bg-bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-colors ${
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
Input.displayName = 'Input';
