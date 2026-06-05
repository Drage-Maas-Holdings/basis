import { Router } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '10')));
  const rows = db
    .prepare(
      `SELECT * FROM activity_log ORDER BY created_at DESC, id DESC LIMIT ?`,
    )
    .all(limit);
  res.json(rows);
});

export default router;
