import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      charCount,
      maxChars,
      className = '',
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId = id ?? `txt-${Math.random().toString(36).slice(2, 9)}`;
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
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm rounded-lg border bg-bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-colors resize-y min-h-[80px] ${
            error ? 'border-loss-text' : 'border-border'
          } ${className}`}
          {...rest}
        />
        <div className="flex justify-between">
          {error ? (
            <span className="text-xs text-loss-text">{error}</span>
          ) : hint ? (
            <span className="text-xs text-text-muted">{hint}</span>
          ) : (
            <span />
          )}
          {maxChars ? (
            <span className="text-xs text-text-muted">
              {charCount ?? 0} / {maxChars}
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
