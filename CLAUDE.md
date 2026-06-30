# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Basis is a lean, self-hosted CRM API (contacts, deals, tasks, interaction logs) built with Hono + Drizzle + SQLite. Single-tenant, no multi-tenancy. The `web/` GUI referenced in README.md does not exist yet — only `api/` is implemented.

## Commands

All commands run from `api/`:

```bash
npm run dev          # tsx watch, runs src/index.ts
npm run build         # rolldown -c
npm start             # run built dist/index.js
npm run lint           # oxlint .
npm run db:generate    # generate a new Drizzle migration from schema.ts changes
npm run db:migrate     # apply pending migrations
npm run db:studio      # Drizzle Studio UI
```

There is no test suite in this repo currently.

Local dev via Docker (from repo root): `docker compose up` (requires `api/.env`, copy from `api/.env.example`). API at `http://localhost:3000`, health check at `/health`.

## Architecture

- **Entry point**: `api/src/index.ts` mounts each route module onto a single Hono app, all under `/` except auth (`/auth`).
- **Routes**: one file per resource in `api/src/routes/` (`contacts.ts`, `deals.ts`, `tasks.ts`, `interaction-logs.ts`, `pipeline.ts`, `reports.ts`, `api-tokens.ts`, `auth.ts`, `health.ts`). Each route file applies `authMiddleware` itself via `.use(...)` rather than globally in `index.ts`.
- **Auth**: Better Auth (`api/src/auth/config.ts`) backed by the Drizzle adapter, using the `@better-auth/api-key` plugin for long-lived service tokens (prefix `basis_`, no expiration, rate limiting disabled). `api/src/auth/middleware.ts` checks session cookie first, then falls back to `Authorization: Bearer <token>` verified via `auth.api.verifyApiKey`.
- **Authorization model**: any authenticated user can read any record; only the record's `ownerId` can update/delete it. This check is duplicated by hand in every route file (no shared helper) — follow the existing pattern (fetch record, compare `existing.ownerId !== user.id`, 403 if mismatched) when adding new resource routes.
- **DB**: `api/src/db/client.ts` is the Drizzle/better-sqlite3 client; `api/src/db/schema.ts` is the single source of truth for all tables, including Better Auth's own tables (`users`, `sessions`, `accounts`, `verifications`, `apikey`). Migrations live in `api/src/db/migrations/` and are generated with `db:generate` — never hand-edit a migration file once committed, generate a new one instead.
- **IDs**: primary keys are `cuid2` strings via `@paralleldrive/cuid2`, not autoincrement integers.
- **Response shape**: list endpoints return `{ data, pagination: { limit, offset, total } }`; single-record endpoints return `{ data }`; errors return `{ error }` with an appropriate status code.

## Reference docs

- `docs/api.md` — full API endpoint documentation (mentioned in README, keep in sync when adding/changing routes).
- `README.md` — data model, ownership model, self-hosting notes, env var reference.
