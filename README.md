# Hyaku

A local-first desktop web app for tracking two concurrent income streams — Forex/Gold day trading and IT services cold outreach — from a single dashboard.

> 百 (hyaku) — Japanese for *hundred*, after the 100-prospect CRM goal.

## Features

- **Dashboard** — live KPIs, 14-trade sparkline, pipeline funnel, and activity feed
- **Trading Journal** — sortable, paginated table for USD/JPY, GBP/JPY and XAU/USD with auto-calculated R-multiples and ZAR P&L
- **IT Services CRM** — 100-prospect pipeline with stages, follow-up tracking, and overdue-next-action indicators
- **Help system** — context-aware help drawer (the `?` button, bottom-right)
- **System-aware theming** — light/dark follows your OS preference; no toggle

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS (custom `prussian-blue` / `regal-navy` / `blue-slate` palette)
- Open Sans (UI) + JetBrains Mono (numbers)
- Express + better-sqlite3 (local data, no browser)
- recharts, react-day-picker, lucide-react

## Getting started

```bash
npm install
npm run dev
```

The dev script starts both the API server (port 3001) and Vite (port 5173) with the `/api` proxy wired up. Open <http://localhost:5173>.

Your data is stored at `data/hyaku.db` (gitignored).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API server (`:3001`) + Vite dev server (`:5173`) with HMR |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run server` | Run the API server on its own (`:3001`) |
| `npm run lint` | ESLint |

## Project layout

```
server/      Express + better-sqlite3 API (port 3001)
  index.ts     app entry
  db.ts        schema, migrations, triggers
  routes/      trades, prospects, dashboard, activity
src/
  pages/       Dashboard, TradingJournal, CRM
  components/  layout / ui / dashboard / trading / crm / help
  hooks/       useTrades, useProspects, useDashboard
  lib/         api, enums, formatters, calculations, helpContent
  types/       shared TypeScript types
data/         SQLite database (gitignored)
```

## License

Private.
