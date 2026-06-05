import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { NumberInput } from '../ui/NumberInput';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { PnlPreview } from './PnlPreview';
import { ASSETS, DIRECTIONS, SESSIONS, TRADE_OUTCOMES } from '../../lib/enums';
import { getDayName, todayIso } from '../../lib/formatters';
import type { Trade, TradeInput } from '../../types';

export interface AddTradeModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Trade | null;
  onSave: (input: TradeInput) => Promise<void>;
}

const empty: TradeInput = {
  trade_date: todayIso(),
  asset: 'USDJPY',
  direction: 'BUY',
  session: 'London',
  entry_price: 0,
  exit_price: null,
  position_size: 0.1,
  stop_loss: 0,
  take_profit: null,
  outcome: 'Open',
  setup: '',
  notes: '',
};

export function AddTradeModal({
  open,
  onClose,
  initial,
  onSave,
}: AddTradeModalProps) {
  const [form, setForm] = useState<TradeInput>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        trade_date: initial.trade_date,
        asset: initial.asset,
        direction: initial.direction,
        session: initial.session,
        entry_price: initial.entry_price,
        exit_price: initial.exit_price,
        position_size: initial.position_size,
        stop_loss: initial.stop_loss,
        take_profit: initial.take_profit,
        outcome: initial.outcome,
        setup: initial.setup ?? '',
        notes: initial.notes ?? '',
      });
    } else {
      setForm({ ...empty, trade_date: todayIso() });
    }
    setError(null);
  }, [open, initial]);

  const set = <K extends keyof TradeInput>(k: K, v: TradeInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (form.entry_price <= 0) {
      setError('Entry price must be > 0');
      return;
    }
    if (form.position_size <= 0) {
      setError('Position size must be > 0');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...form,
        exit_price: form.exit_price === ('' as any) ? null : form.exit_price,
        take_profit:
          form.take_profit === ('' as any) ? null : form.take_profit,
        setup: form.setup?.trim() || null,
        notes: form.notes?.trim() || null,
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const slWarning =
    form.direction === 'BUY' && form.stop_loss >= form.entry_price
      ? 'For BUY, SL should be below entry'
      : form.direction === 'SELL' && form.stop_loss <= form.entry_price
        ? 'For SELL, SL should be above entry'
        : null;
  const tpWarning =
    form.take_profit != null && form.direction === 'BUY' && form.take_profit <= form.entry_price
      ? 'For BUY, TP should be above entry'
      : form.take_profit != null && form.direction === 'SELL' && form.take_profit >= form.entry_price
        ? 'For SELL, TP should be below entry'
        : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Trade' : 'Add Trade'}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Trade'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DatePicker
          label="Date"
          value={form.trade_date}
          onChange={(v) => set('trade_date', v)}
          maxDate={new Date()}
        />
        <Input
          label="Day"
          value={getDayName(form.trade_date)}
          readOnly
          disabled
        />
        <Select
          label="Asset"
          value={form.asset}
          onChange={(v) => set('asset', v as any)}
          options={ASSETS as unknown as string[]}
        />
        <Select
          label="Direction"
          value={form.direction}
          onChange={(v) => set('direction', v as any)}
          options={DIRECTIONS as unknown as string[]}
        />
        <Select
          label="Session"
          value={form.session}
          onChange={(v) => set('session', v as any)}
          options={SESSIONS as unknown as string[]}
        />
        <Select
          label="Outcome"
          value={form.outcome}
          onChange={(v) => set('outcome', v as any)}
          options={TRADE_OUTCOMES as unknown as string[]}
        />
        <NumberInput
          label="Entry Price"
          value={form.entry_price}
          onValueChange={(v) => set('entry_price', v === '' ? 0 : v)}
          step={form.asset === 'XAUUSD' ? 0.01 : 0.00001}
          min={0}
        />
        <NumberInput
          label="Exit Price"
          value={form.exit_price ?? ''}
          onValueChange={(v) =>
            set('exit_price', v === '' ? null : v)
          }
          step={form.asset === 'XAUUSD' ? 0.01 : 0.00001}
          min={0}
          hint="Leave empty for open trades"
        />
        <NumberInput
          label="Position Size (lots)"
          value={form.position_size}
          onValueChange={(v) => set('position_size', v === '' ? 0 : v)}
          step={0.01}
          min={0.01}
        />
        <NumberInput
          label="Stop Loss"
          value={form.stop_loss}
          onValueChange={(v) => set('stop_loss', v === '' ? 0 : v)}
          step={form.asset === 'XAUUSD' ? 0.01 : 0.00001}
          min={0}
          error={slWarning ?? undefined}
        />
        <NumberInput
          label="Take Profit"
          value={form.take_profit ?? ''}
          onValueChange={(v) =>
            set('take_profit', v === '' ? null : v)
          }
          step={form.asset === 'XAUUSD' ? 0.01 : 0.00001}
          min={0}
          error={tpWarning ?? undefined}
        />
        <Input
          label="Strategy / Setup"
          value={form.setup ?? ''}
          onChange={(e) => set('setup', e.target.value)}
          maxLength={80}
          placeholder="e.g. ICT OTE + BOS"
        />
      </div>

      <div className="mt-4">
        <Textarea
          label="Notes"
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          maxLength={500}
          charCount={(form.notes ?? '').length}
          placeholder="What did you observe? Lessons learned…"
        />
      </div>

      <div className="mt-4">
        <PnlPreview
          asset={form.asset}
          direction={form.direction}
          entry_price={form.entry_price}
          exit_price={form.exit_price}
          stop_loss={form.stop_loss}
          position_size={form.position_size}
        />
      </div>

      {error ? (
        <div className="mt-3 text-sm text-loss-text">{error}</div>
      ) : null}
    </Modal>
  );
}
