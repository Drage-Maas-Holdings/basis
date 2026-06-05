import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Trade } from '../../types';
import { Card, CardHeader } from '../ui/Card';

export function TradingSparkline({ trades }: { trades: Trade[] }) {
  const data = [...trades]
    .reverse()
    .map((t, i) => ({
      name: `${i + 1}`,
      fullDate: t.trade_date,
      pnl: t.pnl_r ?? 0,
    }));

  return (
    <Card>
      <CardHeader
        title="Last Trades"
        subtitle="P&L in R · last 14 closed trades"
        right={
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-win-text" />
              <span className="text-text-secondary">Win</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-loss-text" />
              <span className="text-text-secondary">Loss</span>
            </span>
          </div>
        }
      />
      <div className="h-56">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-text-muted">
            No trades yet — add one to see your progress.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--bg-surface-2)' }}
                contentStyle={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                }}
                formatter={(v: any) => [`${Number(v).toFixed(2)} R`, 'P&L']}
                labelFormatter={(_l, p) => {
                  const item = p?.[0]?.payload;
                  return item ? `Trade ${item.name} · ${item.fullDate}` : '';
                }}
              />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.pnl >= 0 ? 'var(--win-text)' : 'var(--loss-text)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
