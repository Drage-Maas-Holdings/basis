import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader } from '../ui/Card';
import { PROSPECT_STAGES } from '../../lib/enums';
import type { ProspectStage } from '../../types';
import { formatNumber } from '../../lib/formatters';

export function PipelineFunnel({
  counts,
  values,
}: {
  counts: Record<ProspectStage, number>;
  values: Record<ProspectStage, number>;
}) {
  const data = PROSPECT_STAGES.map((stage) => ({
    stage,
    count: counts[stage] ?? 0,
    value: values[stage] ?? 0,
  }));

  return (
    <Card>
      <CardHeader
        title="Pipeline Stages"
        subtitle="Prospects per stage"
      />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              stroke="var(--text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              dataKey="stage"
              type="category"
              stroke="var(--text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={110}
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
              formatter={(v: any, _n, p: any) => {
                const item = p?.payload;
                return [item ? `${v} · R ${formatNumber(item.value)}` : v, 'Count'];
              }}
            />
            <Bar dataKey="count" fill="var(--brand-teal)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
