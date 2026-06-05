# IncomeOps — Product Requirements Document & Technical Specification

**Version:** 1.1  
**Stack:** Vite · React · TypeScript · Tailwind CSS · SQLite (better-sqlite3)  
**Target:** Coding agent / developer handoff  

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Design System](#2-design-system)
3. [Navigation & Layout Shell](#3-navigation--layout-shell)
4. [Page 1 — Dashboard](#4-page-1--dashboard)
5. [Page 2 — Trading Journal](#5-page-2--trading-journal)
6. [Page 3 — IT Services CRM](#6-page-3--it-services-crm)
7. [FAB Help System](#7-fab-help-system)
8. [Database Schema (SQLite)](#8-database-schema-sqlite)
9. [Data Access Layer](#9-data-access-layer)
10. [Derived / Computed Values](#10-derived--computed-values)
11. [Enum Reference](#11-enum-reference)
12. [Component Inventory](#12-component-inventory)
13. [File & Folder Structure](#13-file--folder-structure)
14. [Implementation Order](#14-implementation-order)

---

## 1. Product Overview

**IncomeOps** is a local-first desktop web app (served by Vite dev server, or built and opened as a file) that helps a solo operator track two concurrent income streams:

| Stream | View |
|--------|------|
| Forex/Gold day trading | Trading Journal |
| IT services cold outreach | IT Services CRM |

A shared Dashboard surfaces live KPIs from both streams. All data is persisted in a local SQLite database via **better-sqlite3** (Node.js). The Vite front-end communicates with a lightweight **Express** API server (same repo) that wraps the SQLite queries — this avoids browser restrictions on native modules.

### Core UX Principles

- **Speed over ceremony** — every common action (add trade, update prospect stage) is ≤ 3 clicks.
- **Auto-compute everything** — no manual number entry for derived fields (R-multiple, P&L, win rate, follow-up count).
- **Enums everywhere** — dropdowns, not free text, for any fixed-choice field to keep data clean.
- **Teach as you go** — a persistent FAB button explains every view and field on demand.
- **System theme** — respect `prefers-color-scheme`; no manual toggle required.

---

## 2. Design System

### 2.1 Theme Tokens (Tailwind CSS variables via `tailwind.config.ts`)

Define these as CSS custom properties in `src/index.css` and wire into Tailwind's `theme.extend.colors`:

```css
/* Light mode */
:root {
  --bg-base:        #F4F6FA;
  --bg-surface:     #FFFFFF;
  --bg-surface-2:   #EEF1F7;
  --border:         #D0D7E3;
  --text-primary:   #1B2A4A;
  --text-secondary: #5A6A8A;
  --text-muted:     #9AAABF;

  --brand-navy:     #1B2A4A;
  --brand-blue:     #2E4D8A;
  --brand-teal:     #1D7874;
  --brand-orange:   #E07B39;

  --win-bg:         #D6F5D6;
  --win-text:       #1A5C1A;
  --loss-bg:        #FAD4D4;
  --loss-text:      #7A1A1A;
  --pending-bg:     #FFF9C4;
  --pending-text:   #6B5B00;
}

/* Dark mode */
.dark {
  --bg-base:        #0F1929;
  --bg-surface:     #1B2A4A;
  --bg-surface-2:   #243352;
  --border:         #2E4068;
  --text-primary:   #E8EDF5;
  --text-secondary: #A0B0CC;
  --text-muted:     #5A7099;

  --brand-navy:     #2E4D8A;
  --brand-blue:     #4A72CC;
  --brand-teal:     #26A69A;
  --brand-orange:   #F4924A;

  --win-bg:         #1A3D1A;
  --win-text:       #7AE87A;
  --loss-bg:        #3D1A1A;
  --loss-text:      #F08080;
  --pending-bg:     #3D3800;
  --pending-text:   #FFE066;
}
```

Apply dark mode via Tailwind's `darkMode: 'media'` strategy (respects `prefers-color-scheme` automatically — no class toggle needed).

### 2.2 Typography

```ts
// tailwind.config.ts fontFamily extension
fontFamily: {
  display: ['"DM Serif Display"', 'Georgia', 'serif'],
  body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
  mono:    ['"JetBrains Mono"', 'monospace'],
}
```

Load from Google Fonts in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

### 2.3 Spacing & Radius

- Base spacing unit: `4px` (Tailwind default)
- Card border radius: `rounded-xl` (12px)
- Input border radius: `rounded-lg` (8px)
- FAB border radius: `rounded-full`

### 2.4 Shadows

```css
--shadow-card: 0 1px 3px rgba(27,42,74,0.08), 0 4px 16px rgba(27,42,74,0.04);
--shadow-fab:  0 4px 24px rgba(27,42,74,0.24);
```

---

## 3. Navigation & Layout Shell

### 3.1 Structure

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (64px collapsed / 220px expanded)          │
│  ┌──────┐  ┌──────────────────────────────────────┐ │
│  │ Nav  │  │  Main content area (flex-1, scroll)  │ │
│  │      │  │                                      │ │
│  │      │  │                                      │ │
│  └──────┘  └──────────────────────────────────────┘ │
│                                        [FAB] ●       │
└─────────────────────────────────────────────────────┘
```

### 3.2 Sidebar Nav Items

| Icon | Label | Route |
|------|-------|-------|
| `LayoutDashboard` (lucide) | Dashboard | `/` |
| `TrendingUp` | Trading Journal | `/trading` |
| `Users` | IT Services CRM | `/crm` |

- Active state: filled background `bg-brand-blue`, white text.
- Sidebar header: app name **IncomeOps** in `font-display` when expanded; logo mark only when collapsed.
- Sidebar toggle: chevron icon at bottom of sidebar.

### 3.3 Top Bar (per page)

- Page title (h1, `font-display`)
- Subtitle / description (small, `text-secondary`)
- Right slot: primary action button (e.g. "+ Add Trade", "+ Add Prospect")

### 3.4 React Router

```tsx
// src/main.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Shell />}>
      <Route index element={<Dashboard />} />
      <Route path="trading" element={<TradingJournal />} />
      <Route path="crm" element={<CRM />} />
    </Route>
  </Routes>
</BrowserRouter>
```

---

## 4. Page 1 — Dashboard

### 4.1 Purpose

Single-screen overview of both income streams. All values are **read-only, computed** — no data entry here.

### 4.2 KPI Card Grid

Six cards in a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` layout:

| # | Label | Source computation | Colour accent | Format |
|---|-------|--------------------|--------------|--------|
| 1 | Win Rate | `wins / total_trades` | brand-blue | `0.0%` |
| 2 | Total P&L | `SUM(pnl_currency)` all closed trades | brand-teal | `R #,##0.00` |
| 3 | Avg R / Trade | `SUM(pnl_r) / total_trades` | brand-navy | `0.00 R` |
| 4 | Prospects Reached | `COUNT(prospects WHERE name IS NOT NULL)` | brand-orange | `0 / 100` |
| 5 | Deals Won | `COUNT(prospects WHERE stage = 'Won')` | brand-teal | integer |
| 6 | Pipeline Value | `SUM(est_deal_value WHERE stage NOT IN ('Won','Lost'))` | brand-blue | `R #,##0` |

Each `KPICard` component:
- Top: category tag (TRADING / CRM) in small caps, muted colour
- Middle: label, 11px, secondary colour
- Bottom: value, 28px, `font-mono`, white (dark card) or brand colour (light surface card)
- Subtle gradient background using brand colour at 10–15% opacity on light mode, 20% on dark

### 4.3 Mini Charts (below KPI cards)

Two small sparkline/bar charts side-by-side:

**Trading — Last 14 Trades Bar Chart**
- X: trade number or date
- Y: P&L in R
- Bars green (positive) / red (negative)
- Use `recharts` `BarChart`

**CRM — Pipeline Funnel**
- Horizontal stacked bar or simple stage count bar
- Each stage a different shade of brand-teal
- Use `recharts` `BarChart` horizontal

### 4.4 Recent Activity Feed

Below charts: a unified feed of the last 10 actions across both modules, sorted by `created_at` descending.

```
● [Trade]   EUR/USD BUY  →  +1.8R   |  2 hours ago
● [CRM]     Acme IT — stage → Proposal Sent  |  4 hours ago
```

Each item has a colour-coded left border (brand-blue for trades, brand-orange for CRM).

---

## 5. Page 2 — Trading Journal

### 5.1 Top Bar Actions

- **"+ Add Trade"** button → opens `AddTradeModal`
- Filter bar: date range picker, asset dropdown, outcome dropdown

### 5.2 Trade Table

Columns (in order):

| Column | Width | Notes |
|--------|-------|-------|
| Date | 90px | Formatted `DD MMM YY` |
| Day | 60px | Auto-filled from date e.g. `Mon` |
| Asset | 80px | Chip/badge |
| Direction | 70px | `BUY` badge (green) / `SELL` badge (red) |
| Session | 90px | Badge |
| Entry | 80px | Numeric, `font-mono` |
| Exit | 80px | Numeric, `font-mono` |
| Size (lots) | 70px | Numeric |
| SL | 80px | Numeric |
| TP | 80px | Numeric |
| P&L (R) | 70px | **Auto-calculated**, coloured |
| P&L (R) | 90px | **Auto-calculated**, coloured |
| Outcome | 80px | Chip: Win/Loss/B-E/Open |
| Setup | 120px | Text |
| Notes | — | Truncated, expand on hover/click |
| Actions | 80px | Edit / Delete icons |

**Row colour coding:**
- Win: `bg-win-bg` with left border `border-l-4 border-win-text`
- Loss: `bg-loss-bg` with left border `border-l-4 border-loss-text`
- Open: `bg-pending-bg` with left border `border-l-4 border-pending-text`
- Break Even: neutral surface

**Sorting:** click any column header to sort ascending/descending.

**Pagination:** 20 rows per page, page controls at bottom.

### 5.3 Add / Edit Trade Modal

Fields and their input types:

| Field | Input Type | Enum / Constraint |
|-------|-----------|-------------------|
| Date | `<DatePicker>` | Max = today |
| Day | Read-only text | Auto from date (`toLocaleDateString('en-ZA', {weekday:'long'})`) |
| Asset | `<Select>` | `USDJPY \| GBPJPY \| XAUUSD` |
| Direction | `<Select>` (2 options) | `BUY \| SELL` |
| Session | `<Select>` | `London \| New York \| Asian \| London-NY Overlap` |
| Entry Price | `<NumberInput>` | > 0; 5 decimal places for FX, 2 for XAU |
| Exit Price | `<NumberInput>` | same as entry |
| Position Size (lots) | `<NumberInput>` | 0.01 step, min 0.01 |
| Stop Loss | `<NumberInput>` | Must be below entry for BUY, above for SELL (soft warning) |
| Take Profit | `<NumberInput>` | Must be above entry for BUY, below for SELL (soft warning) |
| Strategy / Setup | `<Input text>` | Free text, max 80 chars |
| Outcome | `<Select>` | `Win \| Loss \| Break Even \| Open` |
| Notes | `<Textarea>` | Max 500 chars |

**P&L fields are read-only in the modal** — displayed live as the user types entry/exit/SL/size:

```
P&L (R):   +1.80 R   ← (exit-entry) / (entry-SL) for BUY
P&L (R):   +R 540.00 ← R-multiple × lot-size × pip-value
```

Pip value assumptions (hardcoded constants, document in code):
- USD/JPY: $9.09 per pip per lot (0.01 lot = $0.0909)
- GBP/JPY: $9.09 per pip per lot
- XAU/USD: $10 per $1 move per lot

On Save: `INSERT` or `UPDATE` trade row, close modal, refresh table + dashboard.

### 5.4 Summary Statistics Bar

Pinned below the top bar, above the table. Single row of chips:

`Total: 47` · `Wins: 28` · `Losses: 16` · `B/E: 3` · `Win Rate: 59.6%` · `Total P&L: R 12,450` · `Avg R: +1.4R`

All computed from the current filter state (not all-time if filters are active).

### 5.5 Delete Confirmation

Clicking delete on a row opens a small inline confirmation popover:  
**"Delete this trade? This cannot be undone."** `[Cancel]` `[Delete]`

---

## 6. Page 3 — IT Services CRM

### 6.1 Top Bar Actions

- **"+ Add Prospect"** button → opens `AddProspectModal`
- Filter bar: Stage dropdown, Priority dropdown, text search (name / contact)
- Progress pill: `67 / 100 prospects reached` (coloured based on progress: red <40, amber <70, green ≥70)

### 6.2 CRM Table

Columns:

| Column | Width | Notes |
|--------|-------|-------|
| # | 40px | Row number 1–100 |
| Business / Contact | 180px | Bold name + sub-text contact person |
| Phone / Email | 140px | |
| Location | 110px | |
| Business Type | 110px | Badge |
| Outreach Method | 110px | Badge |
| First Contact | 90px | Date picker fills this |
| Stage | 130px | Coloured stage badge (see below) |
| Last Activity | 90px | |
| Next Action | 130px | |
| Next Action Date | 90px | Date, red if overdue |
| Service Interest | 120px | Multi-select badges |
| Est. Value (R) | 100px | `font-mono` |
| Priority | 80px | 🔴🟡🟢 |
| Outcome | 90px | Badge |
| Follow-ups | 60px | Auto-count (integer) |
| Notes | — | Truncated |
| Actions | 80px | Edit / Delete |

**Stage badge colours:**

| Stage | Background | Text |
|-------|-----------|------|
| New Lead | `#E3F2FD` / dark `#1A2A3A` | blue |
| Contacted | `#E8EAF6` / dark `#1E2340` | indigo |
| Interested | `#FFF9C4` / dark `#3A3200` | amber |
| Meeting Booked | `#FFF3E0` / dark `#3A2000` | orange |
| Proposal Sent | `#F3E5F5` / dark `#2A1A3A` | purple |
| Negotiation | `#FCE4EC` / dark `#3A1020` | pink |
| Won | win colours | green |
| Lost | loss colours | red |
| No Answer | `#ECEFF1` / dark `#1A1E22` | grey |

### 6.3 Add / Edit Prospect Modal

Fields:

| Field | Input Type | Enum / Constraint |
|-------|-----------|-------------------|
| Business / Contact Name | `<Input>` | Required, max 120 chars |
| Contact Person | `<Input>` | max 80 chars |
| Phone | `<Input>` | tel format |
| Email | `<Input>` | email format |
| Location / Area | `<Input>` | max 80 chars |
| Business Type | `<Select>` | `Retail \| Restaurant \| Medical \| Legal \| Real Estate \| Manufacturing \| Education \| NGO \| Government \| Other` |
| Outreach Method | `<Select>` | `Cold Call \| In-Person Visit \| WhatsApp \| Email \| Referral` |
| First Contact Date | `<DatePicker>` | Auto-fills Day field |
| Stage | `<Select>` | 9 options (see enum) |
| Last Activity Date | `<DatePicker>` | |
| Next Action | `<Input>` | max 120 chars |
| Next Action Date | `<DatePicker>` | highlighted red if past today |
| Service Interest | `<MultiSelect>` | `IT Support \| Networking \| CCTV \| Website Dev \| Software \| Cloud Services \| Hardware \| Training \| Other` |
| Est. Deal Value (R) | `<NumberInput>` | min 0 |
| Priority | `<Select>` | `High \| Medium \| Low` |
| Outcome | `<Select>` | `Open \| Won \| Lost \| Not Interested \| Call Back` |
| Notes | `<Textarea>` | max 500 chars |

**Follow-up count** is read-only: `COUNT(activity_log WHERE prospect_id = this.id)` — shown in modal as informational.

On Save: upsert prospect, auto-increment follow-up counter if stage changes, close modal, refresh table.

### 6.4 Pipeline Summary Panel

Collapsible right-side panel (or toggleable drawer on narrow screens):

```
PIPELINE SUMMARY
─────────────────────────
Stage            Count   Value
New Lead           12    —
Contacted          18    —
Interested          8    R 240,000
Meeting Booked      5    R 185,000
Proposal Sent       4    R 160,000
Negotiation         2    R 90,000
Won                 3    R 195,000
Lost                6    —
─────────────────────────
Total Pipeline     52    R 870,000
```

### 6.5 Overdue Next-Action Indicator

Rows where `next_action_date < TODAY AND outcome = 'Open'` get a pulsing amber left border and the date cell is rendered in red.

---

## 7. FAB Help System

### 7.1 FAB Button

- Fixed position: `bottom-6 right-6`
- Size: `w-14 h-14`
- Icon: `HelpCircle` (lucide), white on brand-teal background
- Box shadow: `--shadow-fab`
- On click: open `HelpDrawer` sliding in from the right

### 7.2 HelpDrawer

- Width: `380px` on desktop, full-width on mobile
- Slides in from the right with a smooth transition (`transition: transform 300ms ease`)
- Has a close `×` button top-right
- Header: current view name + icon
- Content: scrollable, with sections per major element

### 7.3 Help Content (per view)

Help content is defined as a static `HELP_CONTENT` object in `src/lib/helpContent.ts`, keyed by route:

#### `/` — Dashboard

```
📊 Dashboard
──────────────
This page gives you a live snapshot of both your income streams.

KPI Cards
Each card auto-updates when you add trades or update prospects.
• Win Rate: your winning trades ÷ total closed trades
• Total P&L: sum of all closed trade profits/losses in Rands
• Avg R/Trade: average risk-reward multiple per trade
• Prospects Reached: how many of your 100 target businesses you have contacted
• Deals Won: CRM prospects marked as "Won"
• Pipeline Value: total estimated deal value for all active (non-Won/Lost) prospects

Charts
• The bar chart shows your last 14 trades — green bars are profits, red are losses.
• The pipeline chart shows how many prospects are at each stage.

Activity Feed
The 10 most recent actions across both modules, newest first.
```

#### `/trading` — Trading Journal

```
📈 Trading Journal
──────────────────
Track every trade you take on USD/JPY, GBP/JPY and XAU/USD.

Adding a Trade
Click "+ Add Trade" in the top right. Fill in your entry details — 
P&L (R) and P&L (R) calculate automatically as you type.

Fields explained
• Date / Day: pick the date; the day of week fills automatically.
• Asset: choose from USD/JPY, GBP/JPY or XAU/USD.
• Direction: BUY if you went long, SELL if you went short.
• Session: which trading session you entered in.
• Entry / Exit Price: your actual fill prices.
• Position Size: lot size (e.g. 0.10 for a micro lot).
• Stop Loss / Take Profit: your planned levels.
• P&L (R): risk multiple — how many R's you made or lost.
  Formula: (Exit − Entry) ÷ (Entry − SL) for a BUY.
• P&L (R): Rand value = R-multiple × lot size × pip value.
• Outcome: mark Win, Loss, Break Even, or leave Open for running trades.
• Setup: the strategy or pattern you traded (e.g. "ICT OTE + BOS").
• Notes: what you observed; lessons learned.

Filtering
Use the filter bar to narrow by date range, asset, or outcome.

Row colours
Green = Win · Red = Loss · Yellow = Open/Break Even
```

#### `/crm` — IT Services CRM

```
🤝 IT Services CRM
──────────────────
Your 100-prospect cold outreach pipeline for IT services.

Adding a Prospect
Click "+ Add Prospect". Fill in contact details, your first contact date,
the stage, and what service they are interested in.

Fields explained
• Business / Contact Name: the company or individual you approached.
• Outreach Method: how you made first contact.
• Stage: where they are in your sales pipeline.
  New Lead → Contacted → Interested → Meeting Booked → 
  Proposal Sent → Negotiation → Won / Lost
• Service Interest: which IT services they expressed interest in.
  You can select multiple.
• Est. Deal Value: your estimated monthly or once-off contract value in Rands.
• Priority: 🔴 High, 🟡 Medium, 🟢 Low — use this to decide your daily call order.
• Next Action / Date: what you need to do next and by when.
  Overdue actions are highlighted in red.
• Follow-ups: auto-counted — increments each time you change the stage.
• Outcome: Open (still active), Won (client), Lost, Not Interested, or Call Back.

Pipeline Summary
The right-side panel shows totals per stage and estimated value.

Progress Tracker
Top of the page shows X / 100 prospects reached.
Goal: contact all 100, then work the pipeline to close.
```

---

## 8. Database Schema (SQLite)

### 8.1 `trades` table

```sql
CREATE TABLE IF NOT EXISTS trades (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_date        TEXT    NOT NULL,                -- ISO date 'YYYY-MM-DD'
  trade_day         TEXT    NOT NULL,                -- 'Monday' … 'Sunday' (derived, stored for query speed)
  asset             TEXT    NOT NULL                 -- CHECK see enum
                    CHECK (asset IN ('USDJPY','GBPJPY','XAUUSD')),
  direction         TEXT    NOT NULL
                    CHECK (direction IN ('BUY','SELL')),
  session           TEXT    NOT NULL
                    CHECK (session IN ('London','New York','Asian','London-NY Overlap')),
  entry_price       REAL    NOT NULL,
  exit_price        REAL,                            -- NULL if trade is still open
  position_size     REAL    NOT NULL,                -- in lots
  stop_loss         REAL    NOT NULL,
  take_profit       REAL,
  pnl_r             REAL,                            -- calculated on write, stored
  pnl_currency      REAL,                            -- calculated on write, stored (ZAR)
  outcome           TEXT    NOT NULL DEFAULT 'Open'
                    CHECK (outcome IN ('Win','Loss','Break Even','Open')),
  setup             TEXT,
  notes             TEXT,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trades_date     ON trades (trade_date);
CREATE INDEX IF NOT EXISTS idx_trades_asset    ON trades (asset);
CREATE INDEX IF NOT EXISTS idx_trades_outcome  ON trades (outcome);
```

### 8.2 `prospects` table

```sql
CREATE TABLE IF NOT EXISTS prospects (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name       TEXT    NOT NULL,
  contact_person      TEXT,
  phone               TEXT,
  email               TEXT,
  location            TEXT,
  business_type       TEXT
                      CHECK (business_type IN (
                        'Retail','Restaurant','Medical','Legal','Real Estate',
                        'Manufacturing','Education','NGO','Government','Other'
                      )),
  outreach_method     TEXT
                      CHECK (outreach_method IN (
                        'Cold Call','In-Person Visit','WhatsApp','Email','Referral'
                      )),
  first_contact_date  TEXT,                          -- ISO date
  stage               TEXT    NOT NULL DEFAULT 'New Lead'
                      CHECK (stage IN (
                        'New Lead','Contacted','Interested','Meeting Booked',
                        'Proposal Sent','Negotiation','Won','Lost','No Answer'
                      )),
  last_activity_date  TEXT,                          -- ISO date
  next_action         TEXT,
  next_action_date    TEXT,                          -- ISO date
  service_interest    TEXT,                          -- JSON array stored as text e.g. '["IT Support","CCTV"]'
  est_deal_value      REAL    DEFAULT 0,
  priority            TEXT    DEFAULT 'Medium'
                      CHECK (priority IN ('High','Medium','Low')),
  outcome             TEXT    DEFAULT 'Open'
                      CHECK (outcome IN ('Open','Won','Lost','Not Interested','Call Back')),
  follow_up_count     INTEGER DEFAULT 0,             -- incremented by trigger on stage change
  notes               TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_prospects_stage    ON prospects (stage);
CREATE INDEX IF NOT EXISTS idx_prospects_priority ON prospects (priority);
CREATE INDEX IF NOT EXISTS idx_prospects_outcome  ON prospects (outcome);
```

### 8.3 `activity_log` table

```sql
CREATE TABLE IF NOT EXISTS activity_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  source       TEXT    NOT NULL CHECK (source IN ('trade','crm')),
  source_id    INTEGER NOT NULL,
  description  TEXT    NOT NULL,               -- human-readable e.g. "EUR/USD BUY +1.8R"
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log (created_at DESC);
```

### 8.4 SQLite Triggers

```sql
-- Auto-update updated_at on trades
CREATE TRIGGER IF NOT EXISTS trades_updated_at
AFTER UPDATE ON trades
BEGIN
  UPDATE trades SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Auto-update updated_at on prospects
CREATE TRIGGER IF NOT EXISTS prospects_updated_at
AFTER UPDATE ON prospects
BEGIN
  UPDATE prospects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Increment follow_up_count when stage changes
CREATE TRIGGER IF NOT EXISTS prospect_stage_change
AFTER UPDATE OF stage ON prospects
WHEN OLD.stage != NEW.stage
BEGIN
  UPDATE prospects SET follow_up_count = follow_up_count + 1 WHERE id = NEW.id;
END;
```

---

## 9. Data Access Layer

### 9.1 Backend: Express + better-sqlite3

Create `server/index.ts` (compiled separately or via `tsx`):

```
server/
  index.ts       ← Express app, mounts all routers
  db.ts          ← opens DB, runs migrations, exports db instance
  routes/
    trades.ts
    prospects.ts
    dashboard.ts
    activity.ts
```

**server/db.ts**

```ts
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'incomeops.db');
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
// run schema migrations on startup
```

**Vite proxy** (`vite.config.ts`):

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

### 9.2 Frontend: Native Fetch via `src/lib/api.ts`

No axios or React Query. All HTTP calls go through a single typed `fetch` wrapper:

```ts
// src/lib/api.ts
const BASE = '/api';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get:    <T>(path: string)                => apiFetch<T>(path),
  post:   <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(path: string)               => apiFetch<T>(path, { method: 'DELETE' }),
};
```

Data fetching in all hooks uses plain `useState` + `useEffect`. Example:

```ts
// src/hooks/useTrades.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Trade } from '../types';

export function useTrades(filters?: Record<string, string>) {
  const [trades, setTrades]   = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ trades: Trade[] }>(`/trades${params}`);
      setTrades(data.trades);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { refetch(); }, [refetch]);

  return { trades, loading, error, refetch };
}
```

Apply the same pattern for `useProspects` and `useDashboard`.

### 9.3 API Endpoints

#### Trades

| Method | Path | Body / Params | Returns |
|--------|------|---------------|---------|
| GET | `/api/trades` | `?asset=&outcome=&from=&to=&page=&limit=` | `{ trades[], total, stats }` |
| GET | `/api/trades/:id` | — | `Trade` |
| POST | `/api/trades` | `TradeInput` | `Trade` |
| PUT | `/api/trades/:id` | `Partial<TradeInput>` | `Trade` |
| DELETE | `/api/trades/:id` | — | `{ success: true }` |

#### Prospects

| Method | Path | Body / Params | Returns |
|--------|------|---------------|---------|
| GET | `/api/prospects` | `?stage=&priority=&search=&page=&limit=` | `{ prospects[], total, pipelineSummary }` |
| GET | `/api/prospects/:id` | — | `Prospect` |
| POST | `/api/prospects` | `ProspectInput` | `Prospect` |
| PUT | `/api/prospects/:id` | `Partial<ProspectInput>` | `Prospect` |
| DELETE | `/api/prospects/:id` | — | `{ success: true }` |

#### Dashboard

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/dashboard` | `DashboardStats` |

#### Activity

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/activity?limit=10` | `ActivityItem[]` |

### 9.4 TypeScript Types

```ts
// src/types/index.ts

export type Asset     = 'USDJPY' | 'GBPJPY' | 'XAUUSD';
export type Direction = 'BUY' | 'SELL';
export type Session   = 'London' | 'New York' | 'Asian' | 'London-NY Overlap';
export type Outcome   = 'Win' | 'Loss' | 'Break Even' | 'Open';

export interface Trade {
  id:             number;
  trade_date:     string;       // 'YYYY-MM-DD'
  trade_day:      string;       // 'Monday' …
  asset:          Asset;
  direction:      Direction;
  session:        Session;
  entry_price:    number;
  exit_price:     number | null;
  position_size:  number;
  stop_loss:      number;
  take_profit:    number | null;
  pnl_r:          number | null;
  pnl_currency:   number | null;
  outcome:        Outcome;
  setup:          string | null;
  notes:          string | null;
  created_at:     string;
  updated_at:     string;
}

export type TradeInput = Omit<Trade, 'id' | 'trade_day' | 'pnl_r' | 'pnl_currency' | 'created_at' | 'updated_at'>;

export type ProspectStage   = 'New Lead'|'Contacted'|'Interested'|'Meeting Booked'|'Proposal Sent'|'Negotiation'|'Won'|'Lost'|'No Answer';
export type ProspectOutcome = 'Open'|'Won'|'Lost'|'Not Interested'|'Call Back';
export type Priority        = 'High'|'Medium'|'Low';
export type OutreachMethod  = 'Cold Call'|'In-Person Visit'|'WhatsApp'|'Email'|'Referral';
export type BusinessType    = 'Retail'|'Restaurant'|'Medical'|'Legal'|'Real Estate'|'Manufacturing'|'Education'|'NGO'|'Government'|'Other';
export type ServiceInterest = 'IT Support'|'Networking'|'CCTV'|'Website Dev'|'Software'|'Cloud Services'|'Hardware'|'Training'|'Other';

export interface Prospect {
  id:                 number;
  business_name:      string;
  contact_person:     string | null;
  phone:              string | null;
  email:              string | null;
  location:           string | null;
  business_type:      BusinessType | null;
  outreach_method:    OutreachMethod | null;
  first_contact_date: string | null;
  stage:              ProspectStage;
  last_activity_date: string | null;
  next_action:        string | null;
  next_action_date:   string | null;
  service_interest:   ServiceInterest[];  // parsed from JSON text
  est_deal_value:     number;
  priority:           Priority;
  outcome:            ProspectOutcome;
  follow_up_count:    number;
  notes:              string | null;
  created_at:         string;
  updated_at:         string;
}

export type ProspectInput = Omit<Prospect, 'id' | 'follow_up_count' | 'created_at' | 'updated_at'>;

export interface DashboardStats {
  trading: {
    totalTrades:  number;
    wins:         number;
    losses:       number;
    breakEven:    number;
    winRate:      number;
    totalPnlR:    number;
    totalPnlCurrency: number;
    avgR:         number;
    recentTrades: Trade[];      // last 14 for sparkline
  };
  crm: {
    totalReached:   number;     // prospects with a name
    dealsWon:       number;
    pipelineValue:  number;
    stageCounts:    Record<ProspectStage, number>;
    stageValues:    Record<ProspectStage, number>;
  };
}

export interface ActivityItem {
  id:          number;
  source:      'trade' | 'crm';
  source_id:   number;
  description: string;
  created_at:  string;
}
```

---

## 10. Derived / Computed Values

### P&L Calculation (server-side, on write)

```ts
// server/lib/calculations.ts

const PIP_VALUES: Record<Asset, number> = {
  USDJPY: 9.09,   // USD per pip per standard lot; adjust for ZAR via FX rate if needed
  GBPJPY: 9.09,
  XAUUSD: 10.00,  // USD per $1 move per standard lot
};

export function calculatePnlR(
  direction: Direction,
  entryPrice: number,
  exitPrice: number,
  stopLoss: number
): number {
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return 0;
  if (direction === 'BUY')  return (exitPrice - entryPrice) / risk;
  return (entryPrice - exitPrice) / risk;
}

export function calculatePnlCurrency(
  asset: Asset,
  pnlR: number,
  positionSize: number  // in lots
): number {
  return pnlR * positionSize * PIP_VALUES[asset] * 100;
  // × 100 converts standard lot pip value to pips moved approximation
  // Adjust this multiplier based on broker pip values
}
```

> **Note to developer:** The pip value constants above are approximations. Adjust them to match your broker's exact pip values. For XAU/USD, 1 lot = 100 oz; a $1 move = $100 profit/loss per lot.

### Day of Week (server-side)

```ts
import { format } from 'date-fns';
const tradeDay = format(new Date(trade_date), 'EEEE'); // 'Monday' … 'Sunday'
```

### Follow-up Count

Managed by the SQLite trigger (see §8.4). No application-level code needed.

---

## 11. Enum Reference

```ts
// src/lib/enums.ts  — single source of truth used in both FE forms and BE validation

export const ASSETS            = ['USDJPY','GBPJPY','XAUUSD'] as const;
export const DIRECTIONS        = ['BUY','SELL'] as const;
export const SESSIONS          = ['London','New York','Asian','London-NY Overlap'] as const;
export const TRADE_OUTCOMES    = ['Win','Loss','Break Even','Open'] as const;

export const PROSPECT_STAGES   = [
  'New Lead','Contacted','Interested','Meeting Booked',
  'Proposal Sent','Negotiation','Won','Lost','No Answer'
] as const;

export const OUTREACH_METHODS  = [
  'Cold Call','In-Person Visit','WhatsApp','Email','Referral'
] as const;

export const BUSINESS_TYPES    = [
  'Retail','Restaurant','Medical','Legal','Real Estate',
  'Manufacturing','Education','NGO','Government','Other'
] as const;

export const SERVICE_INTERESTS = [
  'IT Support','Networking','CCTV','Website Dev','Software',
  'Cloud Services','Hardware','Training','Other'
] as const;

export const PRIORITIES        = ['High','Medium','Low'] as const;
export const PROSPECT_OUTCOMES = ['Open','Won','Lost','Not Interested','Call Back'] as const;
```

---

## 12. Component Inventory

```
src/components/
  ui/
    Badge.tsx           ← coloured chip with text; variant prop
    Button.tsx          ← primary | secondary | ghost | danger
    Card.tsx            ← surface card with optional header
    DatePicker.tsx      ← wraps react-day-picker; returns 'YYYY-MM-DD'
    Input.tsx           ← text input with label + error
    Modal.tsx           ← dialog overlay with close on backdrop click
    MultiSelect.tsx     ← checkbox dropdown for multi-value fields
    NumberInput.tsx     ← numeric with step, min, max
    Select.tsx          ← single-value dropdown with enum options
    Spinner.tsx         ← loading indicator
    Table.tsx           ← sortable, paginated table shell
    Textarea.tsx        ← resizable textarea with char count

  layout/
    Shell.tsx           ← sidebar + top bar + <Outlet />
    Sidebar.tsx         ← collapsible nav
    TopBar.tsx          ← page title + actions slot

  dashboard/
    KPICard.tsx
    TradingSparkline.tsx
    PipelineFunnel.tsx
    ActivityFeed.tsx

  trading/
    TradeTable.tsx
    TradeRow.tsx
    AddTradeModal.tsx
    TradeStatsBar.tsx
    PnlPreview.tsx      ← live R + currency calculation preview inside modal

  crm/
    ProspectTable.tsx
    ProspectRow.tsx
    AddProspectModal.tsx
    PipelineSummaryPanel.tsx
    ProgressPill.tsx

  help/
    FAB.tsx
    HelpDrawer.tsx
```

---

## 13. File & Folder Structure

```
incomeops/
├── data/                        ← SQLite DB lives here (gitignored)
│   └── incomeops.db
├── server/
│   ├── index.ts                 ← Express entry point (port 3001)
│   ├── db.ts
│   ├── lib/
│   │   └── calculations.ts
│   └── routes/
│       ├── trades.ts
│       ├── prospects.ts
│       ├── dashboard.ts
│       └── activity.ts
├── src/
│   ├── components/              ← (see §12)
│   ├── hooks/
│   │   ├── useTrades.ts         ← useState/useEffect hooks wrapping /api/trades via src/lib/api.ts
│   │   ├── useProspects.ts
│   │   └── useDashboard.ts
│   ├── lib/
│   │   ├── api.ts               ← native fetch wrapper (no axios); all HTTP calls go through here
│   │   ├── enums.ts
│   │   ├── helpContent.ts
│   │   └── formatters.ts        ← currency, date, R-multiple formatters
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── TradingJournal.tsx
│   │   └── CRM.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

### Key `package.json` dependencies to add

```json
{
  "dependencies": {
    "react-router-dom": "^6",
    "recharts": "^2",
    "react-day-picker": "^8",
    "lucide-react": "^0.383.0",
    "date-fns": "^3",
    "express": "^4"
  },
  "devDependencies": {
    "better-sqlite3": "^9",
    "@types/better-sqlite3": "^7",
    "@types/express": "^4",
    "tsx": "^4",
    "concurrently": "^8"
  }
}
```

> **No axios or @tanstack/react-query.** All HTTP calls use the native `fetch` API via `src/lib/api.ts`. Data fetching in components uses plain `useState` + `useEffect` hooks — see §9.2 for the pattern.

Add to `package.json` scripts:
```json
"scripts": {
  "dev":    "concurrently \"tsx watch server/index.ts\" \"vite\"",
  "build":  "tsc && vite build",
  "server": "tsx server/index.ts"
}
```

---

## 14. Implementation Order

Recommended sequence for the coding agent:

1. **Server foundation** — `server/db.ts`, schema migrations, `server/index.ts` with health check
2. **Trades API** — `/api/trades` CRUD with calculation logic
3. **Prospects API** — `/api/prospects` CRUD
4. **Dashboard & Activity APIs**
5. **Design system** — Tailwind config, CSS variables, base UI components (`Button`, `Card`, `Input`, `Select`, `Badge`, `Modal`, `DatePicker`)
6. **Shell layout** — `Shell`, `Sidebar`, `TopBar`, React Router setup
7. **Dashboard page** — KPI cards, charts, activity feed (read-only, consuming real API)
8. **Trading Journal page** — table + `AddTradeModal` + stats bar
9. **CRM page** — table + `AddProspectModal` + pipeline panel
10. **FAB + HelpDrawer** — wired to route-aware content from `helpContent.ts`
11. **Dark mode** — verify all tokens, test with `prefers-color-scheme: dark`
12. **Polish** — transitions, loading states, empty states, error boundaries

---

*End of PRD & Specification — IncomeOps v1.1*  
*Changelog: v1.1 — removed @tanstack/react-query and axios; replaced with native fetch wrapper (`src/lib/api.ts`) and plain useState/useEffect hooks. Added @types/express to devDependencies.*
