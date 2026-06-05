import { Router } from 'express';
import { db } from '../db';
import { calculatePnlR, calculatePnlCurrency, getDayName } from '../lib/calculations';
import type { TradeRow, Outcome } from '../types';

const router = Router();

const ALLOWED_ASSETS = ['USDJPY', 'GBPJPY', 'XAUUSD'];
const ALLOWED_DIRECTIONS = ['BUY', 'SELL'];
const ALLOWED_SESSIONS = ['London', 'New York', 'Asian', 'London-NY Overlap'];
const ALLOWED_OUTCOMES: Outcome[] = ['Win', 'Loss', 'Break Even', 'Open'];

interface TradeInput {
  trade_date: string;
  asset: string;
  direction: string;
  session: string;
  entry_price: number;
  exit_price?: number | null;
  position_size: number;
  stop_loss: number;
  take_profit?: number | null;
  outcome?: string;
  setup?: string | null;
  notes?: string | null;
}

function validateTradeInput(input: any, partial = false): string | null {
  if (!partial || input.trade_date !== undefined) {
    if (!input.trade_date || typeof input.trade_date !== 'string')
      return 'trade_date is required (YYYY-MM-DD)';
  }
  if (!partial || input.asset !== undefined) {
    if (!ALLOWED_ASSETS.includes(input.asset)) return 'asset invalid';
  }
  if (!partial || input.direction !== undefined) {
    if (!ALLOWED_DIRECTIONS.includes(input.direction)) return 'direction invalid';
  }
  if (!partial || input.session !== undefined) {
    if (!ALLOWED_SESSIONS.includes(input.session)) return 'session invalid';
  }
  if (!partial || input.entry_price !== undefined) {
    if (typeof input.entry_price !== 'number' || input.entry_price <= 0)
      return 'entry_price must be > 0';
  }
  if (!partial || input.position_size !== undefined) {
    if (typeof input.position_size !== 'number' || input.position_size <= 0)
      return 'position_size must be > 0';
  }
  if (!partial || input.stop_loss !== undefined) {
    if (typeof input.stop_loss !== 'number') return 'stop_loss must be a number';
  }
  if (input.outcome !== undefined && input.outcome !== null && input.outcome !== '') {
    if (!ALLOWED_OUTCOMES.includes(input.outcome)) return 'outcome invalid';
  }
  return null;
}

function rowToTrade(row: TradeRow) {
  return { ...row };
}

function describeTrade(row: TradeRow): string {
  const r = row.pnl_r != null ? `${row.pnl_r >= 0 ? '+' : ''}${row.pnl_r.toFixed(2)}R` : 'open';
  return `${row.asset} ${row.direction} → ${r}`;
}

// List trades with filters + pagination + stats
router.get('/', (req, res) => {
  const { asset, outcome, from, to } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, parseInt((req.query.page as string) ?? '1'));
  const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) ?? '100')));
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: any[] = [];
  if (asset && ALLOWED_ASSETS.includes(asset)) {
    where.push('asset = ?');
    params.push(asset);
  }
  if (outcome && ALLOWED_OUTCOMES.includes(outcome as Outcome)) {
    where.push('outcome = ?');
    params.push(outcome);
  }
  if (from) {
    where.push('trade_date >= ?');
    params.push(from);
  }
  if (to) {
    where.push('trade_date <= ?');
    params.push(to);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRow = db
    .prepare(`SELECT COUNT(*) as c FROM trades ${whereSql}`)
    .get(...params) as { c: number };

  const rows = db
    .prepare(
      `SELECT * FROM trades ${whereSql} ORDER BY trade_date DESC, id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as TradeRow[];

  // Stats from the same filtered set (all filtered, not just page)
  const statRows = db
    .prepare(`SELECT * FROM trades ${whereSql}`)
    .all(...params) as TradeRow[];

  const wins = statRows.filter((t) => t.outcome === 'Win').length;
  const losses = statRows.filter((t) => t.outcome === 'Loss').length;
  const breakEven = statRows.filter((t) => t.outcome === 'Break Even').length;
  const closed = wins + losses + breakEven;
  const totalPnlR = statRows.reduce((s, t) => s + (t.pnl_r ?? 0), 0);
  const totalPnlCurrency = statRows.reduce((s, t) => s + (t.pnl_currency ?? 0), 0);
  const avgR = closed > 0 ? totalPnlR / closed : 0;
  const winRate = closed > 0 ? wins / closed : 0;

  res.json({
    trades: rows.map(rowToTrade),
    total: totalRow.c,
    page,
    limit,
    stats: {
      total: statRows.length,
      wins,
      losses,
      breakEven,
      winRate,
      totalPnlR,
      totalPnlCurrency,
      avgR,
    },
  });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as
    | TradeRow
    | undefined;
  if (!row) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(rowToTrade(row));
});

router.post('/', (req, res) => {
  const input = req.body as TradeInput;
  const err = validateTradeInput(input);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }

  const trade_day = getDayName(input.trade_date);
  const exitPrice = input.exit_price ?? null;
  const pnlR = exitPrice != null
    ? calculatePnlR(input.direction as any, input.entry_price, exitPrice, input.stop_loss)
    : null;
  const pnlCurrency =
    pnlR != null
      ? calculatePnlCurrency(input.asset as any, pnlR, input.position_size)
      : null;

  const outcome = (input.outcome && input.outcome !== '')
    ? input.outcome
    : (pnlR == null ? 'Open' : pnlR > 0.05 ? 'Win' : pnlR < -0.05 ? 'Loss' : 'Break Even');

  const result = db
    .prepare(
      `INSERT INTO trades
       (trade_date, trade_day, asset, direction, session,
        entry_price, exit_price, position_size, stop_loss, take_profit,
        pnl_r, pnl_currency, outcome, setup, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.trade_date,
      trade_day,
      input.asset,
      input.direction,
      input.session,
      input.entry_price,
      exitPrice,
      input.position_size,
      input.stop_loss,
      input.take_profit ?? null,
      pnlR,
      pnlCurrency,
      outcome,
      input.setup ?? null,
      input.notes ?? null,
    );

  const id = Number(result.lastInsertRowid);
  const row = db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as TradeRow;
  db.prepare(
    `INSERT INTO activity_log (source, source_id, description) VALUES (?, ?, ?)`,
  ).run('trade', id, describeTrade(row));

  res.status(201).json(rowToTrade(row));
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as
    | TradeRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const input = req.body as Partial<TradeInput>;
  const err = validateTradeInput({ ...existing, ...input }, true);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }

  const merged: TradeRow = { ...existing, ...input } as TradeRow;
  const trade_day = input.trade_date
    ? getDayName(input.trade_date)
    : existing.trade_day;
  const exitPrice = merged.exit_price ?? null;
  const pnlR = exitPrice != null
    ? calculatePnlR(merged.direction, merged.entry_price, exitPrice, merged.stop_loss)
    : null;
  const pnlCurrency =
    pnlR != null
      ? calculatePnlCurrency(merged.asset, pnlR, merged.position_size)
      : null;
  const outcome = merged.outcome
    ? merged.outcome
    : (pnlR == null ? 'Open' : pnlR > 0.05 ? 'Win' : pnlR < -0.05 ? 'Loss' : 'Break Even');

  db.prepare(
    `UPDATE trades SET
       trade_date = ?, trade_day = ?, asset = ?, direction = ?, session = ?,
       entry_price = ?, exit_price = ?, position_size = ?, stop_loss = ?, take_profit = ?,
       pnl_r = ?, pnl_currency = ?, outcome = ?, setup = ?, notes = ?
     WHERE id = ?`,
  ).run(
    merged.trade_date,
    trade_day,
    merged.asset,
    merged.direction,
    merged.session,
    merged.entry_price,
    exitPrice,
    merged.position_size,
    merged.stop_loss,
    merged.take_profit ?? null,
    pnlR,
    pnlCurrency,
    outcome,
    merged.setup ?? null,
    merged.notes ?? null,
    id,
  );

  const row = db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as TradeRow;
  db.prepare(
    `INSERT INTO activity_log (source, source_id, description) VALUES (?, ?, ?)`,
  ).run('trade', id, describeTrade(row));

  res.json(rowToTrade(row));
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = db.prepare('DELETE FROM trades WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
