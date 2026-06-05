import { Router } from 'express';
import { db } from '../db';
import { PROSPECT_STAGES, PROSPECT_OUTCOMES, PRIORITIES, OUTREACH_METHODS, BUSINESS_TYPES, SERVICE_INTERESTS } from './enums';
import type { ProspectRow } from '../types';

const router = Router();

interface ProspectInput {
  business_name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  business_type?: string | null;
  outreach_method?: string | null;
  first_contact_date?: string | null;
  stage?: string;
  last_activity_date?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  service_interest?: string[];
  est_deal_value?: number;
  priority?: string;
  outcome?: string;
  notes?: string | null;
}

function validate(input: any, partial = false): string | null {
  if (!partial || input.business_name !== undefined) {
    if (!input.business_name || typeof input.business_name !== 'string' || input.business_name.length > 120)
      return 'business_name is required (max 120 chars)';
  }
  if (input.business_type != null && input.business_type !== '' && !BUSINESS_TYPES.includes(input.business_type as any))
    return 'business_type invalid';
  if (input.outreach_method != null && input.outreach_method !== '' && !OUTREACH_METHODS.includes(input.outreach_method as any))
    return 'outreach_method invalid';
  if (input.stage != null && input.stage !== '' && !PROSPECT_STAGES.includes(input.stage as any))
    return 'stage invalid';
  if (input.priority != null && input.priority !== '' && !PRIORITIES.includes(input.priority as any))
    return 'priority invalid';
  if (input.outcome != null && input.outcome !== '' && !PROSPECT_OUTCOMES.includes(input.outcome as any))
    return 'outcome invalid';
  if (input.service_interest != null) {
    if (!Array.isArray(input.service_interest))
      return 'service_interest must be an array';
    for (const s of input.service_interest) {
      if (!SERVICE_INTERESTS.includes(s as any)) return `service_interest contains invalid value: ${s}`;
    }
  }
  return null;
}

function rowToProspect(row: ProspectRow) {
  let serviceInterest: string[] = [];
  if (row.service_interest) {
    try {
      const parsed = JSON.parse(row.service_interest);
      if (Array.isArray(parsed)) serviceInterest = parsed;
    } catch {
      serviceInterest = [];
    }
  }
  return { ...row, service_interest: serviceInterest };
}

function describeProspect(row: ProspectRow): string {
  return `${row.business_name} — stage → ${row.stage}`;
}

function computePipeline(rows: ProspectRow[]) {
  const stageCounts: Record<string, number> = {};
  const stageValues: Record<string, number> = {};
  for (const s of PROSPECT_STAGES) {
    stageCounts[s] = 0;
    stageValues[s] = 0;
  }
  let totalActive = 0;
  let totalActiveValue = 0;
  for (const r of rows) {
    stageCounts[r.stage] = (stageCounts[r.stage] ?? 0) + 1;
    if (r.stage !== 'Won' && r.stage !== 'Lost') {
      totalActive += 1;
      totalActiveValue += r.est_deal_value;
      stageValues[r.stage] = (stageValues[r.stage] ?? 0) + r.est_deal_value;
    } else {
      // For total value summary include Won too
      stageValues[r.stage] = (stageValues[r.stage] ?? 0) + r.est_deal_value;
    }
  }
  return { stageCounts, stageValues, totalActive, totalActiveValue };
}

router.get('/', (req, res) => {
  const { stage, priority, search } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, parseInt((req.query.page as string) ?? '1'));
  const limit = Math.min(500, Math.max(1, parseInt((req.query.limit as string) ?? '100')));
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: any[] = [];
  if (stage && PROSPECT_STAGES.includes(stage as any)) {
    where.push('stage = ?');
    params.push(stage);
  }
  if (priority && PRIORITIES.includes(priority as any)) {
    where.push('priority = ?');
    params.push(priority);
  }
  if (search && search.trim()) {
    where.push('(business_name LIKE ? OR contact_person LIKE ?)');
    const like = `%${search.trim()}%`;
    params.push(like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRow = db
    .prepare(`SELECT COUNT(*) as c FROM prospects ${whereSql}`)
    .get(...params) as { c: number };

  const rows = db
    .prepare(
      `SELECT * FROM prospects ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as ProspectRow[];

  // Pipeline computed on the filtered set (all matches, not just the page)
  const allFiltered = db
    .prepare(`SELECT * FROM prospects ${whereSql}`)
    .all(...params) as ProspectRow[];

  res.json({
    prospects: rows.map(rowToProspect),
    total: totalRow.c,
    page,
    limit,
    pipelineSummary: computePipeline(allFiltered),
  });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare('SELECT * FROM prospects WHERE id = ?').get(id) as
    | ProspectRow
    | undefined;
  if (!row) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(rowToProspect(row));
});

router.post('/', (req, res) => {
  const input = req.body as ProspectInput;
  const err = validate(input);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }
  const serviceInterest = JSON.stringify(input.service_interest ?? []);
  const result = db
    .prepare(
      `INSERT INTO prospects
       (business_name, contact_person, phone, email, location,
        business_type, outreach_method, first_contact_date, stage,
        last_activity_date, next_action, next_action_date,
        service_interest, est_deal_value, priority, outcome, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.business_name,
      input.contact_person ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.location ?? null,
      input.business_type ?? null,
      input.outreach_method ?? null,
      input.first_contact_date ?? null,
      input.stage ?? 'New Lead',
      input.last_activity_date ?? null,
      input.next_action ?? null,
      input.next_action_date ?? null,
      serviceInterest,
      input.est_deal_value ?? 0,
      input.priority ?? 'Medium',
      input.outcome ?? 'Open',
      input.notes ?? null,
    );
  const id = Number(result.lastInsertRowid);
  const row = db.prepare('SELECT * FROM prospects WHERE id = ?').get(id) as ProspectRow;
  db.prepare(
    `INSERT INTO activity_log (source, source_id, description) VALUES (?, ?, ?)`,
  ).run('crm', id, describeProspect(row));
  res.status(201).json(rowToProspect(row));
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM prospects WHERE id = ?').get(id) as
    | ProspectRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const input = req.body as Partial<ProspectInput>;
  const err = validate({ ...existing, ...input }, true);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }
  const serviceInterest = input.service_interest !== undefined
    ? JSON.stringify(input.service_interest)
    : existing.service_interest;
  const merged = { ...existing, ...input };
  db.prepare(
    `UPDATE prospects SET
       business_name = ?, contact_person = ?, phone = ?, email = ?, location = ?,
       business_type = ?, outreach_method = ?, first_contact_date = ?, stage = ?,
       last_activity_date = ?, next_action = ?, next_action_date = ?,
       service_interest = ?, est_deal_value = ?, priority = ?, outcome = ?, notes = ?
     WHERE id = ?`,
  ).run(
    merged.business_name,
    merged.contact_person ?? null,
    merged.phone ?? null,
    merged.email ?? null,
    merged.location ?? null,
    merged.business_type ?? null,
    merged.outreach_method ?? null,
    merged.first_contact_date ?? null,
    merged.stage ?? 'New Lead',
    merged.last_activity_date ?? null,
    merged.next_action ?? null,
    merged.next_action_date ?? null,
    serviceInterest,
    merged.est_deal_value ?? 0,
    merged.priority ?? 'Medium',
    merged.outcome ?? 'Open',
    merged.notes ?? null,
    id,
  );
  const row = db.prepare('SELECT * FROM prospects WHERE id = ?').get(id) as ProspectRow;
  db.prepare(
    `INSERT INTO activity_log (source, source_id, description) VALUES (?, ?, ?)`,
  ).run('crm', id, describeProspect(row));
  res.json(rowToProspect(row));
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = db.prepare('DELETE FROM prospects WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
