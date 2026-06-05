import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Table, type Column } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StageBadge } from './StageBadge';
import { PriorityDot } from './PriorityDot';
import {
  formatCurrency,
  formatDate,
  isOverdue,
} from '../../lib/formatters';
import type { Prospect } from '../../types';

export interface ProspectTableProps {
  prospects: Prospect[];
  onEdit: (p: Prospect) => void;
  onDelete: (p: Prospect) => void;
}

export function ProspectTable({
  prospects,
  onEdit,
  onDelete,
}: ProspectTableProps) {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const columns: Column<Prospect>[] = [
    {
      key: 'id',
      header: '#',
      width: '50px',
      cell: (p) => <span className="font-mono text-xs text-text-muted">{p.id}</span>,
      sortValue: (p) => p.id,
    },
    {
      key: 'business_name',
      header: 'Business / Contact',
      width: '200px',
      cell: (p) => (
        <div className="leading-tight">
          <div className="font-semibold text-text-primary text-sm">
            {p.business_name}
          </div>
          {p.contact_person ? (
            <div className="text-xs text-text-muted">{p.contact_person}</div>
          ) : null}
        </div>
      ),
      sortValue: (p) => p.business_name.toLowerCase(),
    },
    {
      key: 'phone',
      header: 'Phone / Email',
      width: '150px',
      cell: (p) => (
        <div className="text-xs leading-tight">
          {p.phone ? <div className="text-text-primary">{p.phone}</div> : null}
          {p.email ? <div className="text-text-secondary">{p.email}</div> : null}
          {!p.phone && !p.email ? (
            <span className="text-text-muted">—</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      width: '120px',
      cell: (p) =>
        p.location ? (
          <span className="text-xs text-text-secondary">{p.location}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'business_type',
      header: 'Business Type',
      width: '120px',
      cell: (p) =>
        p.business_type ? (
          <Badge variant="default">{p.business_type}</Badge>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'outreach_method',
      header: 'Outreach',
      width: '120px',
      cell: (p) =>
        p.outreach_method ? (
          <Badge variant="brand-navy">{p.outreach_method}</Badge>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'first_contact_date',
      header: 'First Contact',
      width: '100px',
      cell: (p) => (
        <span className="font-mono text-xs">{formatDate(p.first_contact_date)}</span>
      ),
      sortValue: (p) => p.first_contact_date ?? '',
    },
    {
      key: 'stage',
      header: 'Stage',
      width: '140px',
      cell: (p) => <StageBadge stage={p.stage} />,
    },
    {
      key: 'last_activity_date',
      header: 'Last Activity',
      width: '100px',
      cell: (p) => (
        <span className="font-mono text-xs">{formatDate(p.last_activity_date)}</span>
      ),
      sortValue: (p) => p.last_activity_date ?? '',
    },
    {
      key: 'next_action',
      header: 'Next Action',
      width: '140px',
      cell: (p) =>
        p.next_action ? (
          <span className="text-xs text-text-primary">{p.next_action}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'next_action_date',
      header: 'Next Date',
      width: '100px',
      cell: (p) => {
        const overdue = p.outcome === 'Open' && isOverdue(p.next_action_date);
        if (!p.next_action_date) return <span className="text-text-muted">—</span>;
        return (
          <span className={`font-mono text-xs ${overdue ? 'text-loss-text font-semibold' : ''}`}>
            {formatDate(p.next_action_date)}
          </span>
        );
      },
      sortValue: (p) => p.next_action_date ?? '',
    },
    {
      key: 'service_interest',
      header: 'Services',
      width: '160px',
      cell: (p) =>
        p.service_interest.length === 0 ? (
          <span className="text-text-muted">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {p.service_interest.slice(0, 2).map((s) => (
              <Badge key={s} variant="brand-blue" size="sm">
                {s}
              </Badge>
            ))}
            {p.service_interest.length > 2 ? (
              <span className="text-[10px] text-text-muted self-center">
                +{p.service_interest.length - 2}
              </span>
            ) : null}
          </div>
        ),
    },
    {
      key: 'est_deal_value',
      header: 'Value',
      width: '110px',
      align: 'right',
      cell: (p) =>
        p.est_deal_value > 0 ? (
          <span className="font-mono text-xs">{formatCurrency(p.est_deal_value)}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
      sortValue: (p) => p.est_deal_value,
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '110px',
      cell: (p) => <PriorityDot priority={p.priority} />,
    },
    {
      key: 'outcome',
      header: 'Outcome',
      width: '110px',
      cell: (p) => {
        const v =
          p.outcome === 'Won'
            ? 'win'
            : p.outcome === 'Lost'
              ? 'loss'
              : p.outcome === 'Not Interested'
                ? 'grey'
                : 'default';
        return <Badge variant={v as any}>{p.outcome}</Badge>;
      },
    },
    {
      key: 'follow_up_count',
      header: 'Follow-ups',
      width: '80px',
      align: 'right',
      cell: (p) => (
        <span className="font-mono text-xs text-text-secondary">
          {p.follow_up_count}
        </span>
      ),
      sortValue: (p) => p.follow_up_count,
    },
    {
      key: 'notes',
      header: 'Notes',
      cell: (p) =>
        p.notes ? (
          <span
            className="text-xs text-text-secondary truncate inline-block max-w-[260px]"
            title={p.notes}
          >
            {p.notes}
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
      cell: (p) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(p);
            }}
            className="p-1.5 rounded text-text-secondary hover:bg-bg-surface-2 hover:text-brand-blue"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          {confirmId === p.id ? (
            <div className="flex items-center gap-1 ml-1">
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmId(null);
                  onDelete(p);
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
                setConfirmId(p.id);
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
      rows={prospects}
      rowKey={(p) => p.id}
      pageSize={20}
      rowClassName={(p) => {
        if (p.outcome === 'Open' && isOverdue(p.next_action_date)) {
          return 'overdue-pulse border-l-4 border-l-brand-orange';
        }
        return '';
      }}
    />
  );
}
