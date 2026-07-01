# Basis CRM — PRD v0.2

**Product:** Basis CRM
**Type:** Internal single-tenant CRM, API + self-hosted web GUI
**Users:** 10-50 internal users
**Data scale:** Tens of thousands of contact and deal records
**Auth:** Better Auth (session-based login + long-lived API tokens)
**Updated:** 2026-06-30

---

## Goals

- Expose a clean, documented REST API for contacts, deals, tasks, and interaction logs
- Provide a self-hosted web GUI with a Kanban pipeline view and basic reporting
- Ship both the API and web GUI from a flat monorepo under `api/` and `web/`
- Support versioned schema migrations with zero ambiguity
- Be deployable as a single Docker Compose stack running both services
- Generate and maintain accurate API documentation from the codebase itself (OpenAPI 3.1)

## Non-goals

- Real-time collaborative editing
- Custom field builders or form designers
- Email sending or inbox sync (interaction logs only)
- Multi-tenancy or organisations
- Sub-team or department-level access controls (single-team model only)

## Ownership model

Any authenticated user can read any record (contacts, deals, tasks, interaction logs). Write access (update and delete) is restricted to the record's owner. This is a deliberate, final decision for the single-tenant model. A multi-team or role-based model would require a dedicated spec introducing a teams table and team-scoped visibility.

---

## API Status

The API is complete as of v0.1.0. All ten core specs have been implemented, verified with runtime evidence, regression-tested (95 integration tests, 0 failures), and documented via auto-generated OpenAPI 3.1 spec and `docs/api.md`. The web GUI is the next major phase.

---

## Build Order and Validation Criteria

### Phase 1 — API (Complete)

| # | Spec | Description | Status | Notes |
|---|------|-------------|--------|-------|
| 1 | Project Scaffold | Hono app, TypeScript, Docker Compose with SQLite volume, Drizzle config, `api/` folder structure | Done | Port bound to `127.0.0.1` only; non-root container user |
| 1a | Monorepo Restructure | Moved API scaffold from project root into `api/`; updated Dockerfile and compose paths; root-level `docker-compose.yml` orchestrates both services | Done | Flat `api/` + `web/` layout chosen over `apps/` convention |
| 2 | Schema and Migrations | Drizzle schema for Users, Contacts, Deals, Tasks, InteractionLogs; cuid2 ids generated in the application layer; migration applied | Done | Addendum: Better Auth (Spec 3) extended users with `email_verified` and `image`, and added `sessions`, `accounts`, `verifications` tables |
| 3 | Auth | Better Auth integrated with Hono; email and password register/login; session middleware; no-enumeration on failed login | Done | Auth handler 404 required root-cause fix; duplicate-email detection uses error code matching, not string matching |
| 4 | Contacts API | CRUD; search (name, email, company); pagination (default 25, cap 100); owner-only writes; shared reads | Done | cuid2 migration applied after UUID deviation found in initial implementation |
| 5 | Deals API | CRUD; stage transitions (new, qualified, won, lost); contact linking with embedded contact data on GET; owner-only writes | Done | `stage_changed_at` column added post-Spec 9 to fix reporting accuracy |
| 6 | Tasks API | CRUD; due dates (positive integer Unix ms enforced); completion toggle; overdue filter; dual contact/deal linking | Done | `due_at <= 0` validation tightened after initial implementation accepted negative timestamps |
| 7 | Interaction Logs API | Append-only (no PUT/DELETE); type enum (email, call, meeting, note); at least one of contact_id or deal_id required | Done | No-update constraint enforced at schema level by omitting `updated_at` |
| 8 | Pipeline Endpoint | `GET /pipeline` returns deals grouped by all four stages with counts, value totals, and embedded contact data; optional `owner_id` filter | Done | Non-paginated by design; verified against truly empty deals table |
| 9 | Reporting Endpoints | `GET /reports/leads-added`, `GET /reports/deals-summary`, `GET /reports/upcoming-tasks`; date range via Unix ms `from`/`to` params | Done | `deals-summary` uses `stage_changed_at` not `updated_at` for accurate close-date reporting |
| 9a | stage_changed_at Fix | Added `stage_changed_at` column to deals; set only on actual stage transitions; backfill script for existing won/lost deals | Done | See `improvements.md` for documented tradeoff vs full stage-history table |
| 10 | API Token Support | Long-lived, non-expiring tokens per user via `@better-auth/api-key` plugin; multiple tokens per user; independent revocation; token auth in middleware alongside session auth | Done | Rate limiting explicitly disabled (service-to-service use case); POST requires session auth to prevent token self-minting; see `improvements.md` |

### Phase 1 — API Documentation (Complete)

| # | Spec | Description | Status |
|---|------|-------------|--------|
| D1 | Integration Test Suite | 95 Vitest integration tests covering all endpoints across 8 categories (auth gate, happy path, validation, 404, 403, pagination, edge cases, shape); isolated test DB; no shared mutable state | Done |
| D2 | OpenAPI / Zod Refactor | All route files converted to `@hono/zod-openapi`; Zod schemas for all request/response shapes; `GET /openapi.json` serves valid OpenAPI 3.1 spec; all 95 tests pass unchanged | Done |
| D3 | API Reference | `docs/api.md` generated from live OpenAPI spec; covers all 29 endpoints with curl examples | Done |
| D4 | README Update | README updated to reflect OpenAPI spec endpoint and Zod contribution requirement | Done |

### Phase 2 — Web GUI (Planned)

Stack and spec to be determined. The web service lives at `web/` in the monorepo and is already defined as a service in `docker-compose.yml`. When ready, specs will be added here following the same build order format.

Minimum expected scope:
- Login and session management
- Contacts list, search, and detail view
- Deal pipeline (Kanban view)
- Task list with overdue and upcoming filters
- Interaction log view per contact and deal
- Basic reporting dashboard
- API token management UI

---

## Data Model

Eight tables currently in the database:

| Table | Purpose |
|---|---|
| `users` | Registered users |
| `contacts` | People and companies |
| `deals` | Opportunities linked to contacts, with stage tracking |
| `tasks` | Follow-up items linked to contacts or deals |
| `interaction_logs` | Append-only record of all communications |
| `sessions` | Better Auth session storage |
| `accounts` | Better Auth account linking (passwords stored here, not on users) |
| `verifications` | Better Auth email verification tokens |
| `apikey` | API tokens managed by Better Auth's API key plugin |

Schema: `api/src/db/schema.ts`
Migrations: `api/src/db/migrations/`

---

## Known Limitations and Deferred Decisions

See `improvements.md` for the full list. Key items:

- `stage_changed_at` captures only the most recent stage transition. A full stage-history table (tracking every transition) is a candidate future improvement if reporting requires historical trend analysis.
- GET /api-tokens and DELETE /api-tokens/:id use direct Drizzle queries on the `apikey` table rather than the plugin's list/delete methods, due to session middleware incompatibility with token-authenticated requests on those plugin methods.
- API key rate limiting is explicitly disabled. If rate limiting is needed in future, it should be implemented at the application layer (Hono middleware) with per-endpoint or per-user limits visible to API consumers.