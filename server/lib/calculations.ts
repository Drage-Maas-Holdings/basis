import type { Asset, Direction } from '../types';

export const PIP_VALUES: Record<Asset, number> = {
  USDJPY: 9.09,
  GBPJPY: 9.09,
  XAUUSD: 10.0,
};

export function calculatePnlR(
  direction: Direction,
  entryPrice: number,
  exitPrice: number | null | undefined,
  stopLoss: number,
): number | null {
  if (exitPrice == null) return null;
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return 0;
  if (direction === 'BUY') return (exitPrice - entryPrice) / risk;
  return (entryPrice - exitPrice) / risk;
}

export function calculatePnlCurrency(
  asset: Asset,
  pnlR: number | null | undefined,
  positionSize: number,
): number | null {
  if (pnlR == null) return null;
  return pnlR * positionSize * PIP_VALUES[asset] * 100;
}

export function getDayName(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-ZA', { weekday: 'long' });
}
