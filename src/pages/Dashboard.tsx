import { TopBar } from '../components/layout/TopBar';
import { KPICard } from '../components/dashboard/KPICard';
import { TradingSparkline } from '../components/dashboard/TradingSparkline';
import { PipelineFunnel } from '../components/dashboard/PipelineFunnel';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { FullPageSpinner } from '../components/ui/Spinner';
import { useDashboard } from '../hooks/useDashboard';
import {
  formatCurrency,
  formatNumber,
  formatPct,
  formatR,
} from '../lib/formatters';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Dashboard() {
  const { stats, activity, loading, error, refetch } = useDashboard();

  if (loading && !stats) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Live snapshot of your income streams" />
        <FullPageSpinner label="Loading dashboard…" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar title="Dashboard" />
        <div className="text-loss-text text-sm">Error: {error}</div>
      </>
    );
  }

  const t = stats!.trading;
  const c = stats!.crm;

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Live snapshot of your income streams"
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={refetch}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          category="TRADING"
          label="Win Rate"
          value={formatPct(t.winRate)}
          accent="brand-blue"
          sub={`${t.wins} wins · ${t.losses} losses`}
        />
        <KPICard
          category="TRADING"
          label="Total P&L"
          value={formatCurrency(t.totalPnlCurrency)}
          accent="brand-teal"
          sub={`${t.totalTrades} trades total`}
        />
        <KPICard
          category="TRADING"
          label="Avg R / Trade"
          value={formatR(t.avgR)}
          accent="brand-navy"
          sub={`Σ ${formatR(t.totalPnlR)}`}
        />
        <KPICard
          category="CRM"
          label="Prospects Reached"
          value={`${c.totalReached} / 100`}
          accent="brand-orange"
          sub={`${c.dealsWon} deals won`}
        />
        <KPICard
          category="CRM"
          label="Deals Won"
          value={formatNumber(c.dealsWon)}
          accent="brand-teal"
        />
        <KPICard
          category="CRM"
          label="Pipeline Value"
          value={formatCurrency(c.pipelineValue)}
          accent="brand-blue"
          sub="active prospects"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <TradingSparkline trades={t.recentTrades} />
        <PipelineFunnel counts={c.stageCounts} values={c.stageValues} />
      </div>

      <div className="mt-4">
        <ActivityFeed items={activity} />
      </div>
    </>
  );
}
