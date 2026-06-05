import { useState } from 'react';
import { Plus, Filter, X } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { Input } from '../components/ui/Input';
import { TradeTable } from '../components/trading/TradeTable';
import { TradeStatsBar } from '../components/trading/TradeStatsBar';
import { AddTradeModal } from '../components/trading/AddTradeModal';
import { useTrades } from '../hooks/useTrades';
import { ASSETS, TRADE_OUTCOMES } from '../lib/enums';
import { FullPageSpinner } from '../components/ui/Spinner';
import type { Trade, TradeInput } from '../types';

export function TradingJournal() {
  const [filters, setFilters] = useState({
    asset: '',
    outcome: '',
    from: '',
    to: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);

  const { trades, stats, loading, error, createTrade, updateTrade, deleteTrade } =
    useTrades({
      asset: filters.asset || undefined,
      outcome: filters.outcome || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      limit: 500,
    });

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (t: Trade) => {
    setEditing(t);
    setModalOpen(true);
  };

  const handleSave = async (input: TradeInput) => {
    if (editing) {
      await updateTrade(editing.id, input);
    } else {
      await createTrade(input);
    }
  };

  const clearFilters = () =>
    setFilters({ asset: '', outcome: '', from: '', to: '' });

  const hasFilters = filters.asset || filters.outcome || filters.from || filters.to;

  return (
    <>
      <TopBar
        title="Trading Journal"
        subtitle="Track every trade on USD/JPY, GBP/JPY and XAU/USD"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Filter size={14} />}
              onClick={() => {
                const el = document.getElementById('filter-bar');
                el?.classList.toggle('hidden');
              }}
            >
              Filters
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
              Add Trade
            </Button>
          </>
        }
      />

      <div
        id="filter-bar"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 p-3 rounded-xl border border-border bg-bg-surface"
      >
        <Select
          label="Asset"
          value={filters.asset}
          onChange={(v) => setFilters((f) => ({ ...f, asset: v }))}
          options={[{ value: '', label: 'All' }, ...ASSETS.map((a) => ({ value: a, label: a }))]}
        />
        <Select
          label="Outcome"
          value={filters.outcome}
          onChange={(v) => setFilters((f) => ({ ...f, outcome: v }))}
          options={[
            { value: '', label: 'All' },
            ...TRADE_OUTCOMES.map((o) => ({ value: o, label: o })),
          ]}
        />
        <DatePicker
          label="From"
          value={filters.from}
          onChange={(v) => setFilters((f) => ({ ...f, from: v }))}
        />
        <DatePicker
          label="To"
          value={filters.to}
          onChange={(v) => setFilters((f) => ({ ...f, to: v }))}
        />
        <div className="flex items-end">
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X size={14} />}
              onClick={clearFilters}
              className="w-full"
            >
              Clear filters
            </Button>
          ) : (
            <Input
              label="Quick add"
              placeholder="Coming soon…"
              disabled
              className="opacity-50"
            />
          )}
        </div>
      </div>

      {stats ? (
        <TradeStatsBar
          total={stats.total}
          wins={stats.wins}
          losses={stats.losses}
          breakEven={stats.breakEven}
          winRate={stats.winRate}
          totalPnlCurrency={stats.totalPnlCurrency}
          avgR={stats.avgR}
        />
      ) : null}

      {error ? (
        <div className="text-sm text-loss-text mb-3">Error: {error}</div>
      ) : null}

      {loading && trades.length === 0 ? (
        <FullPageSpinner label="Loading trades…" />
      ) : (
        <TradeTable
          trades={trades}
          onEdit={openEdit}
          onDelete={(t) => {
            if (window.confirm(`Delete this trade? This cannot be undone.`)) {
              deleteTrade(t.id);
            }
          }}
        />
      )}

      <AddTradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={handleSave}
      />
    </>
  );
}
