import { Badge } from '../ui/Badge';

export function TradeStatsBar({
  total,
  wins,
  losses,
  breakEven,
  winRate,
  totalPnlCurrency,
  avgR,
}: {
  total: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number;
  totalPnlCurrency: number;
  avgR: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 px-1">
      <Badge variant="default">Total: {total}</Badge>
      <Badge variant="win">Wins: {wins}</Badge>
      <Badge variant="loss">Losses: {losses}</Badge>
      <Badge variant="pending">B/E: {breakEven}</Badge>
      <Badge variant="brand-blue">Win Rate: {(winRate * 100).toFixed(1)}%</Badge>
      <Badge
        variant={totalPnlCurrency >= 0 ? 'win' : 'loss'}
      >
        Total P&L: R {Math.abs(totalPnlCurrency).toLocaleString('en-ZA', {
          maximumFractionDigits: 0,
        })}
        {totalPnlCurrency < 0 ? ' loss' : ''}
      </Badge>
      <Badge variant={avgR >= 0 ? 'brand-teal' : 'loss'}>
        Avg R: {avgR >= 0 ? '+' : ''}{avgR.toFixed(2)}R
      </Badge>
    </div>
  );
}
