import express from 'express';
import './db';
import tradesRouter from './routes/trades';
import prospectsRouter from './routes/prospects';
import dashboardRouter from './routes/dashboard';
import activityRouter from './routes/activity';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'hyaku', time: new Date().toISOString() });
});

app.use('/api/trades', tradesRouter);
app.use('/api/prospects', prospectsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/activity', activityRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err?.message ?? 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Hyaku API listening on http://localhost:${PORT}`);
});
