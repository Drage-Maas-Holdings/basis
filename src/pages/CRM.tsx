import { useState } from 'react';
import { Plus, Filter, X, Maximize2, Minimize2 } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { ProspectTable } from '../components/crm/ProspectTable';
import { AddProspectModal } from '../components/crm/AddProspectModal';
import { PipelineSummaryPanel } from '../components/crm/PipelineSummaryPanel';
import { ProgressPill } from '../components/crm/ProgressPill';
import { useProspects } from '../hooks/useProspects';
import { PRIORITIES, PROSPECT_STAGES } from '../lib/enums';
import { FullPageSpinner } from '../components/ui/Spinner';
import type { Prospect, ProspectInput } from '../types';

export function CRM() {
  const [filters, setFilters] = useState({
    stage: '',
    priority: '',
    search: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const {
    prospects,
    pipelineSummary,
    loading,
    error,
    createProspect,
    updateProspect,
    deleteProspect,
  } = useProspects({
    stage: filters.stage || undefined,
    priority: filters.priority || undefined,
    search: filters.search || undefined,
    limit: 500,
  });

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (p: Prospect) => {
    setEditing(p);
    setModalOpen(true);
  };

  const handleSave = async (input: ProspectInput) => {
    if (editing) {
      await updateProspect(editing.id, input);
    } else {
      await createProspect(input);
    }
  };

  const clearFilters = () => setFilters({ stage: '', priority: '', search: '' });
  const hasFilters = filters.stage || filters.priority || filters.search;

  const totalReached = prospects.length > 0
    ? prospects.filter((p) => !!p.business_name).length
    : 0;

  return (
    <>
      <TopBar
        title="IT Services CRM"
        subtitle="100-prospect cold outreach pipeline"
        actions={
          <>
            <ProgressPill reached={totalReached} />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={panelOpen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              onClick={() => setPanelOpen((o) => !o)}
              title={panelOpen ? 'Hide pipeline summary' : 'Show pipeline summary'}
              aria-pressed={!panelOpen}
            >
              {panelOpen ? 'Focus' : 'Show panel'}
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
              Add Prospect
            </Button>
          </>
        }
      />

      <div
        className={`grid grid-cols-1 gap-4 ${
          panelOpen ? 'lg:grid-cols-[1fr_320px]' : ''
        }`}
      >
        <div className="min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 p-3 rounded-xl border border-border bg-bg-surface">
            <Input
              label="Search"
              placeholder="Name or contact…"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
            <Select
              label="Stage"
              value={filters.stage}
              onChange={(v) => setFilters((f) => ({ ...f, stage: v }))}
              options={[
                { value: '', label: 'All stages' },
                ...PROSPECT_STAGES.map((s) => ({ value: s, label: s })),
              ]}
            />
            <Select
              label="Priority"
              value={filters.priority}
              onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
              options={[
                { value: '', label: 'All priorities' },
                ...PRIORITIES.map((p) => ({ value: p, label: p })),
              ]}
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
                  Clear
                </Button>
              ) : (
                <div className="text-xs text-text-muted flex items-center gap-1 pb-2.5">
                  <Filter size={12} /> {prospects.length} prospects
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="text-sm text-loss-text mb-3">Error: {error}</div>
          ) : null}

          {loading && prospects.length === 0 ? (
            <FullPageSpinner label="Loading prospects…" />
          ) : (
            <ProspectTable
              prospects={prospects}
              onEdit={openEdit}
              onDelete={(p) => {
                if (window.confirm(`Delete ${p.business_name}? This cannot be undone.`)) {
                  deleteProspect(p.id);
                }
              }}
            />
          )}
        </div>

        <div
          className={`min-w-0 ${
            panelOpen ? 'lg:sticky lg:top-6 lg:self-start block' : 'hidden'
          }`}
        >
          <PipelineSummaryPanel summary={pipelineSummary} />
        </div>
      </div>

      <AddProspectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={handleSave}
      />
    </>
  );
}
