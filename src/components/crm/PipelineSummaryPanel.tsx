import { PROSPECT_STAGES } from '../../lib/enums';
import { Card, CardHeader } from '../ui/Card';
import { formatCurrency } from '../../lib/formatters';
import type { PipelineSummary, ProspectStage } from '../../types';

const STAGE_ORDER: ProspectStage[] = PROSPECT_STAGES as unknown as ProspectStage[];

export function PipelineSummaryPanel({ summary }: { summary: PipelineSummary | null }) {
  return (
    <Card>
      <CardHeader
        title="Pipeline Summary"
        subtitle="Counts & value per stage"
      />
      {!summary ? (
        <div className="text-sm text-text-muted py-4">Loading…</div>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-text-muted">
                <th className="text-left py-1.5 font-medium">Stage</th>
                <th className="text-right py-1.5 font-medium">Count</th>
                <th className="text-right py-1.5 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {STAGE_ORDER.map((s) => (
                <tr key={s} className="border-t border-border">
                  <td className="py-1.5 text-text-primary">{s}</td>
                  <td className="py-1.5 text-right font-mono text-text-secondary">
                    {summary.stageCounts[s] ?? 0}
                  </td>
                  <td className="py-1.5 text-right font-mono text-text-primary">
                    {(summary.stageValues[s] ?? 0) > 0
                      ? formatCurrency(summary.stageValues[s])
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="py-2 text-xs uppercase font-semibold text-text-secondary tracking-wide">
                  Active
                </td>
                <td className="py-2 text-right font-mono font-semibold text-text-primary">
                  {summary.totalActive}
                </td>
                <td className="py-2 text-right font-mono font-semibold text-text-primary">
                  {formatCurrency(summary.totalActiveValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </>
      )}
    </Card>
  );
}
