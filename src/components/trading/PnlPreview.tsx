import { useMemo } from 'react';
import {
  calculatePnlR,
  calculatePnlCurrency,
} from '../../lib/calculations';
import { Card } from '../ui/Card';
import { formatCurrencyDecimal, formatR } from '../../lib/formatters';
import type { Asset, Direction, TradeInput } from '../../types';

export function PnlPreview({
  asset,
  direction,
  entry_price,
  exit_price,
  stop_loss,
  position_size,
}: Partial<TradeInput> & { asset?: Asset; direction?: Direction }) {
  const result = useMemo(() => {
    if (
      entry_price == null ||
      stop_loss == null ||
      position_size == null ||
      asset == null ||
      direction == null
    ) {
      return { pnlR: null, pnlCurrency: null };
    }
    const pnlR = calculatePnlR(
      direction,
      entry_price,
      exit_price,
      stop_loss,
    );
    const pnlCurrency = calculatePnlCurrency(asset, pnlR, position_size);
    return { pnlR, pnlCurrency };
  }, [asset, direction, entry_price, exit_price, stop_loss, position_size]);

  const rColor =
    result.pnlR == null
      ? 'text-text-muted'
      : result.pnlR > 0
        ? 'text-win-text'
        : result.pnlR < 0
          ? 'text-loss-text'
          : 'text-text-secondary';

  return (
    <Card className="bg-bg-surface-2/40">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-muted">
            P&amp;L (R)
          </div>
          <div className={`font-mono text-xl font-semibold mt-0.5 ${rColor}`}>
            {result.pnlR != null ? formatR(result.pnlR) : '—'}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-muted">
            P&amp;L (R)
          </div>
          <div className={`font-mono text-xl font-semibold mt-0.5 ${rColor}`}>
            {result.pnlCurrency != null
              ? formatCurrencyDecimal(result.pnlCurrency)
              : '—'}
          </div>
        </div>
      </div>
    </Card>
  );
}
