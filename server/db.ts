import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, 'incomeops.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS trades (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_date        TEXT    NOT NULL,
  trade_day         TEXT    NOT NULL,
  asset             TEXT    NOT NULL
                    CHECK (asset IN ('USDJPY','GBPJPY','XAUUSD')),
  direction         TEXT    NOT NULL
                    CHECK (direction IN ('BUY','SELL')),
  session           TEXT    NOT NULL
                    CHECK (session IN ('London','New York','Asian','London-NY Overlap')),
  entry_price       REAL    NOT NULL,
  exit_price        REAL,
  position_size     REAL    NOT NULL,
  stop_loss         REAL    NOT NULL,
  take_profit       REAL,
  pnl_r             REAL,
  pnl_currency      REAL,
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
  first_contact_date  TEXT,
  stage               TEXT    NOT NULL DEFAULT 'New Lead'
                      CHECK (stage IN (
                        'New Lead','Contacted','Interested','Meeting Booked',
                        'Proposal Sent','Negotiation','Won','Lost','No Answer'
                      )),
  last_activity_date  TEXT,
  next_action         TEXT,
  next_action_date    TEXT,
  service_interest    TEXT,
  est_deal_value      REAL    DEFAULT 0,
  priority            TEXT    DEFAULT 'Medium'
                      CHECK (priority IN ('High','Medium','Low')),
  outcome             TEXT    DEFAULT 'Open'
                      CHECK (outcome IN ('Open','Won','Lost','Not Interested','Call Back')),
  follow_up_count     INTEGER DEFAULT 0,
  notes               TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_prospects_stage    ON prospects (stage);
CREATE INDEX IF NOT EXISTS idx_prospects_priority ON prospects (priority);
CREATE INDEX IF NOT EXISTS idx_prospects_outcome  ON prospects (outcome);

CREATE TABLE IF NOT EXISTS activity_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  source       TEXT    NOT NULL CHECK (source IN ('trade','crm')),
  source_id    INTEGER NOT NULL,
  description  TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log (created_at DESC);

CREATE TRIGGER IF NOT EXISTS trades_updated_at
AFTER UPDATE ON trades
BEGIN
  UPDATE trades SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS prospects_updated_at
AFTER UPDATE ON prospects
BEGIN
  UPDATE prospects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS prospect_stage_change
AFTER UPDATE OF stage ON prospects
WHEN OLD.stage != NEW.stage
BEGIN
  UPDATE prospects SET follow_up_count = follow_up_count + 1 WHERE id = NEW.id;
END;
`;

db.exec(SCHEMA);
