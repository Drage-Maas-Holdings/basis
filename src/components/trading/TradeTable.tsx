import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Table, type Column } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  formatCurrencyDecimal,
  formatDate,
  formatNumber,
  formatR,
  getDayShort,
} from '../../lib/formatters';
import type { Trade } from '../../types';

export interface TradeTableProps {
  trades: Trade[];
  onEdit: (t: Trade) => void;
  onDelete: (t: Trade) => void;
}

export function TradeTable({ trades, onEdit, onDelete }: TradeTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const columns: Column<Trade>[] = [
    {
      key: 'trade_date',
      header: 'Date',
      width: '90px',
      cell: (t) => <span className="font-mono text-xs">{formatDate(t.trade_date)}</span>,
      sortValue: (t) => t.trade_date,
    },
    {
      key: 'trade_day',
      header: 'Day',
      width: '60px',
      cell: (t) => <span className="text-text-secondary text-xs">{getDayShort(t.trade_date)}</span>,
    },
    {
      key: 'asset',
      header: 'Asset',
      width: '80px',
      cell: (t) => <Badge variant="brand-navy">{t.asset}</Badge>,
      sortValue: (t) => t.asset,
    },
    {
      key: 'direction',
      header: 'Dir',
      width: '70px',
      cell: (t) => (
        <Badge variant={t.direction === 'BUY' ? 'win' : 'loss'}>
          {t.direction}
        </Badge>
      ),
    },
    {
      key: 'session',
      header: 'Session',
      width: '110px',
      cell: (t) => <Badge variant="default">{t.session}</Badge>,
    },
    {
      key: 'entry_price',
      header: 'Entry',
      width: '80px',
      align: 'right',
      cell: (t) => (
        <span className="font-mono text-xs">{formatNumber(t.entry_price, t.asset === 'XAUUSD' ? 2 : 5)}</span>
      ),
      sortValue: (t) => t.entry_price,
    },
    {
      key: 'exit_price',
      header: 'Exit',
      width: '80px',
      align: 'right',
      cell: (t) =>
        t.exit_price == null ? (
          <span className="text-text-muted">—</span>
        ) : (
          <span className="font-mono text-xs">
            {formatNumber(t.exit_price, t.asset === 'XAUUSD' ? 2 : 5)}
          </span>
        ),
      sortValue: (t) => t.exit_price,
    },
    {
      key: 'position_size',
      header: 'Lots',
      width: '60px',
      align: 'right',
      cell: (t) => <span className="font-mono text-xs">{t.position_size.toFixed(2)}</span>,
      sortValue: (t) => t.position_size,
    },
    {
      key: 'stop_loss',
      header: 'SL',
      width: '80px',
      align: 'right',
      cell: (t) => <span className="font-mono text-xs">{formatNumber(t.stop_loss, t.asset === 'XAUUSD' ? 2 : 5)}</span>,
    },
    {
      key: 'take_profit',
      header: 'TP',
      width: '80px',
      align: 'right',
      cell: (t) =>
        t.take_profit == null ? (
          <span className="text-text-muted">—</span>
        ) : (
          <span className="font-mono text-xs">{formatNumber(t.take_profit, t.asset === 'XAUUSD' ? 2 : 5)}</span>
        ),
    },
    {
      key: 'pnl_r',
      header: 'R',
      width: '70px',
      align: 'right',
      cell: (t) => {
        if (t.pnl_r == null) return <span className="text-text-muted">—</span>;
        const c =
          t.pnl_r > 0
            ? 'text-win-text font-semibold'
            : t.pnl_r < 0
              ? 'text-loss-text font-semibold'
              : 'text-text-secondary';
        return <span className={`font-mono text-xs ${c}`}>{formatR(t.pnl_r)}</span>;
      },
      sortValue: (t) => t.pnl_r,
    },
    {
      key: 'pnl_currency',
      header: 'P&L',
      width: '100px',
      align: 'right',
      cell: (t) => {
        if (t.pnl_currency == null) return <span className="text-text-muted">—</span>;
        const c =
          t.pnl_currency > 0
            ? 'text-win-text font-semibold'
            : t.pnl_currency < 0
              ? 'text-loss-text font-semibold'
              : 'text-text-secondary';
        return <span className={`font-mono text-xs ${c}`}>{formatCurrencyDecimal(t.pnl_currency)}</span>;
      },
      sortValue: (t) => t.pnl_currency,
    },
    {
      key: 'outcome',
      header: 'Outcome',
      width: '90px',
      cell: (t) => {
        const v =
          t.outcome === 'Win'
            ? 'win'
            : t.outcome === 'Loss'
              ? 'loss'
              : t.outcome === 'Open'
                ? 'pending'
                : 'default';
        return <Badge variant={v as any}>{t.outcome}</Badge>;
      },
    },
    {
      key: 'setup',
      header: 'Setup',
      width: '140px',
      cell: (t) =>
        t.setup ? (
          <span className="text-xs text-text-secondary truncate inline-block max-w-[140px]">
            {t.setup}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'notes',
      header: 'Notes',
      cell: (t) =>
        t.notes ? (
          <span
            className="text-xs text-text-secondary truncate inline-block max-w-[260px]"
            title={t.notes}
          >
            {t.notes}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      width: '110px',
      align: 'right',
      cell: (t) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(t);
            }}
            className="p-1.5 rounded text-text-secondary hover:bg-bg-surface-2 hover:text-brand-blue"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          {confirmId === t.id ? (
            <div className="flex items-center gap-1 ml-1">
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmId(null);
                  onDelete(t);
                }}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmId(t.id);
              }}
              className="p-1.5 rounded text-text-secondary hover:bg-bg-surface-2 hover:text-loss-text"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={trades}
      rowKey={(t) => t.id}
      pageSize={20}
      rowClassName={(t) => {
        switch (t.outcome) {
          case 'Win':
            return 'bg-win-bg/40 border-l-4 border-l-win-text';
          case 'Loss':
            return 'bg-loss-bg/40 border-l-4 border-l-loss-text';
          case 'Open':
            return 'bg-pending-bg/30 border-l-4 border-l-pending-text';
          default:
            return '';
        }
      }}
    />
  );
}
