import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { NumberInput } from '../ui/NumberInput';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  BUSINESS_TYPES,
  OUTREACH_METHODS,
  PRIORITIES,
  PROSPECT_OUTCOMES,
  PROSPECT_STAGES,
  SERVICE_INTERESTS,
} from '../../lib/enums';
import type { Prospect, ProspectInput, ServiceInterest } from '../../types';

export interface AddProspectModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Prospect | null;
  onSave: (input: ProspectInput) => Promise<void>;
}

const empty: ProspectInput = {
  business_name: '',
  contact_person: '',
  phone: '',
  email: '',
  location: '',
  business_type: null,
  outreach_method: null,
  first_contact_date: '',
  stage: 'New Lead',
  last_activity_date: '',
  next_action: '',
  next_action_date: '',
  service_interest: [],
  est_deal_value: 0,
  priority: 'Medium',
  outcome: 'Open',
  notes: '',
};

export function AddProspectModal({
  open,
  onClose,
  initial,
  onSave,
}: AddProspectModalProps) {
  const [form, setForm] = useState<ProspectInput>(empty);
  const [services, setServices] = useState<ServiceInterest[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        business_name: initial.business_name,
        contact_person: initial.contact_person ?? '',
        phone: initial.phone ?? '',
        email: initial.email ?? '',
        location: initial.location ?? '',
        business_type: initial.business_type,
        outreach_method: initial.outreach_method,
        first_contact_date: initial.first_contact_date ?? '',
        stage: initial.stage,
        last_activity_date: initial.last_activity_date ?? '',
        next_action: initial.next_action ?? '',
        next_action_date: initial.next_action_date ?? '',
        service_interest: initial.service_interest,
        est_deal_value: initial.est_deal_value,
        priority: initial.priority,
        outcome: initial.outcome,
        notes: initial.notes ?? '',
      });
      setServices(initial.service_interest);
    } else {
      setForm({ ...empty });
      setServices([]);
    }
    setError(null);
  }, [open, initial]);

  const set = <K extends keyof ProspectInput>(k: K, v: ProspectInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.business_name.trim()) {
      setError('Business / Contact name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...form,
        business_name: form.business_name.trim(),
        contact_person: form.contact_person?.trim() || null,
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        location: form.location?.trim() || null,
        business_type: form.business_type || null,
        outreach_method: form.outreach_method || null,
        first_contact_date: form.first_contact_date || null,
        last_activity_date: form.last_activity_date || null,
        next_action: form.next_action?.trim() || null,
        next_action_date: form.next_action_date || null,
        service_interest: services,
        notes: form.notes?.trim() || null,
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Prospect' : 'Add Prospect'}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Prospect'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Business / Contact Name *"
          value={form.business_name}
          onChange={(e) => set('business_name', e.target.value)}
          maxLength={120}
          required
        />
        <Input
          label="Contact Person"
          value={form.contact_person ?? ''}
          onChange={(e) => set('contact_person', e.target.value)}
          maxLength={80}
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+27 …"
        />
        <Input
          label="Email"
          type="email"
          value={form.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
        />
        <Input
          label="Location / Area"
          value={form.location ?? ''}
          onChange={(e) => set('location', e.target.value)}
          maxLength={80}
        />
        <Select
          label="Business Type"
          value={form.business_type ?? ''}
          onChange={(v) => set('business_type', (v || null) as any)}
          options={[{ value: '', label: '—' }, ...BUSINESS_TYPES.map((b) => ({ value: b, label: b }))]}
        />
        <Select
          label="Outreach Method"
          value={form.outreach_method ?? ''}
          onChange={(v) => set('outreach_method', (v || null) as any)}
          options={[{ value: '', label: '—' }, ...OUTREACH_METHODS.map((b) => ({ value: b, label: b }))]}
        />
        <DatePicker
          label="First Contact Date"
          value={form.first_contact_date ?? ''}
          onChange={(v) => set('first_contact_date', v)}
        />
        <Select
          label="Stage"
          value={form.stage}
          onChange={(v) => set('stage', v as any)}
          options={PROSPECT_STAGES.map((s) => ({ value: s, label: s }))}
        />
        <DatePicker
          label="Last Activity Date"
          value={form.last_activity_date ?? ''}
          onChange={(v) => set('last_activity_date', v)}
        />
        <Input
          label="Next Action"
          value={form.next_action ?? ''}
          onChange={(e) => set('next_action', e.target.value)}
          maxLength={120}
          placeholder="e.g. Send proposal"
        />
        <DatePicker
          label="Next Action Date"
          value={form.next_action_date ?? ''}
          onChange={(v) => set('next_action_date', v)}
        />
        <NumberInput
          label="Est. Deal Value (R)"
          value={form.est_deal_value}
          onValueChange={(v) => set('est_deal_value', v === '' ? 0 : v)}
          step={100}
          min={0}
        />
        <Select
          label="Priority"
          value={form.priority}
          onChange={(v) => set('priority', v as any)}
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        />
        <Select
          label="Outcome"
          value={form.outcome}
          onChange={(v) => set('outcome', v as any)}
          options={PROSPECT_OUTCOMES.map((o) => ({ value: o, label: o }))}
        />
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-text-secondary">
          Service Interest
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SERVICE_INTERESTS.map((s) => {
            const active = services.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (active) setServices(services.filter((x) => x !== s));
                  else setServices([...services, s]);
                }}
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                  active
                    ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30'
                    : 'bg-bg-surface text-text-secondary border-border hover:border-brand-blue/30'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        {services.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {services.map((s) => (
              <Badge key={s} variant="brand-blue" size="sm">
                {s}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <Textarea
          label="Notes"
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          maxLength={500}
          charCount={(form.notes ?? '').length}
          placeholder="Conversation notes, decision makers, follow-up ideas…"
        />
      </div>

      {initial ? (
        <div className="mt-3 text-xs text-text-muted">
          Follow-ups: <span className="font-mono">{initial.follow_up_count}</span>{' '}
          (auto-increments on stage change)
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 text-sm text-loss-text">{error}</div>
      ) : null}
    </Modal>
  );
}
