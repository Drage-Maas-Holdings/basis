export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return 'R 0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}R ${abs.toLocaleString('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatCurrencyDecimal(
  value: number | null | undefined,
  decimals = 2,
): string {
  if (value == null || isNaN(value)) return 'R 0.00';
  const sign = value < 0 ? '-' : '';
  return `${sign}R ${Math.abs(value).toLocaleString('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatR(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0.00 R';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)} R`;
}

export function formatPct(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return '0.0%';
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(
  value: number | null | undefined,
  decimals = 0,
): string {
  if (value == null || isNaN(value)) return '0';
  return value.toLocaleString('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? 's' : ''} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? 's' : ''} ago`;
  return formatDate(iso);
}

export function getDayName(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-ZA', { weekday: 'long' });
}

export function getDayShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-ZA', { weekday: 'short' });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(dateIso: string | null | undefined): boolean {
  if (!dateIso) return false;
  return dateIso < todayIso();
}
