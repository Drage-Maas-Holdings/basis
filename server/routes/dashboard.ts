import { Router } from 'express';
import { db } from '../db';
import { PROSPECT_STAGES } from './enums';
import type { TradeRow, ProspectRow } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  // Trading stats
  const tradeRows = db.prepare('SELECT * FROM trades').all() as TradeRow[];
  const wins = tradeRows.filter((t) => t.outcome === 'Win').length;
  const losses = tradeRows.filter((t) => t.outcome === 'Loss').length;
  const breakEven = tradeRows.filter((t) => t.outcome === 'Break Even').length;
  const closed = wins + losses + breakEven;
  const totalPnlR = tradeRows.reduce((s, t) => s + (t.pnl_r ?? 0), 0);
  const totalPnlCurrency = tradeRows.reduce(
    (s, t) => s + (t.pnl_currency ?? 0),
    0,
  );
  const avgR = closed > 0 ? totalPnlR / closed : 0;
  const winRate = closed > 0 ? wins / closed : 0;
  const recentTrades = (tradeRows as TradeRow[])
    .sort((a, b) => (b.trade_date.localeCompare(a.trade_date)) || (b.id - a.id))
    .slice(0, 14);

  // CRM stats
  const prospectRows = db
    .prepare('SELECT * FROM prospects')
    .all() as ProspectRow[];
  const totalReached = prospectRows.filter((p) => !!p.business_name).length;
  const dealsWon = prospectRows.filter((p) => p.stage === 'Won').length;

  const stageCounts: Record<string, number> = {};
  const stageValues: Record<string, number> = {};
  for (const s of PROSPECT_STAGES) {
    stageCounts[s] = 0;
    stageValues[s] = 0;
  }
  let pipelineValue = 0;
  for (const p of prospectRows) {
    stageCounts[p.stage] = (stageCounts[p.stage] ?? 0) + 1;
    if (p.stage !== 'Won' && p.stage !== 'Lost') {
      pipelineValue += p.est_deal_value;
      stageValues[p.stage] = (stageValues[p.stage] ?? 0) + p.est_deal_value;
    } else {
      stageValues[p.stage] = (stageValues[p.stage] ?? 0) + p.est_deal_value;
    }
  }

  res.json({
    trading: {
      totalTrades: tradeRows.length,
      wins,
      losses,
      breakEven,
      winRate,
      totalPnlR,
      totalPnlCurrency,
      avgR,
      recentTrades,
    },
    crm: {
      totalReached,
      dealsWon,
      pipelineValue,
      stageCounts,
      stageValues,
    },
  });
});

export default router;
