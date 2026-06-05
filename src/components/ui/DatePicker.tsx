import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export interface DatePickerProps {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (iso: string) => void;
  label?: string;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Pick a date',
  maxDate,
  minDate,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : undefined;
  const display = value ? format(selected!, 'dd MMM yyyy') : '';

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      ) : null}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-bg-surface text-left hover:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-colors"
        >
          <CalendarIcon size={16} className="text-text-secondary" />
          <span className={display ? 'text-text-primary' : 'text-text-muted'}>
            {display || placeholder}
          </span>
        </button>
        {open ? (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setOpen(false)}
            />
            <div className="absolute z-30 mt-1 bg-bg-surface border border-border rounded-xl shadow-card p-3">
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={(d) => {
                  if (d) {
                    onChange(format(d, 'yyyy-MM-dd'));
                    setOpen(false);
                  }
                }}
                disabled={[
                  ...(maxDate ? [{ after: maxDate }] : []),
                  ...(minDate ? [{ before: minDate }] : []),
                ]}
                showOutsideDays
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
