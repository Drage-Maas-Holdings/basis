## Basis CRM - PRD v0.1

**Product:** Basis CRM
**Type:** Internal single-tenant CRM, API + self-hosted web GUI
**Users:** 10-50 internal users
**Data scale:** Tens of thousands of contact and deal records
**Auth:** Owned by Basis via Better Auth, exposed to consuming dashboards via API token or session

---

### Goals
- Expose a clean REST API for contacts, deals, tasks, and interaction logs
- Provide a self-hosted web GUI with a Kanban pipeline view and basic reporting
- Ship both the API and web GUI from a monorepo under `api/` and `web/`
- Support versioned schema migrations with zero ambiguity
- Be deployable as a single Docker Compose stack running both services

### Non-goals
- Real-time collaborative editing
- Custom field builders or form designers
- Email sending or inbox sync (interaction logs only)
- Multi-tenancy

---

## Build Order and Validation Criteria

| # | Spec | Description | Validation Criteria |
|---|------|-------------|---------------------|
| 1 | Project Scaffold | Hono app, TypeScript config, Docker Compose with SQLite volume, Drizzle config, folder structure | `docker compose up` starts the server; `GET /health` returns 200; Drizzle can connect to the SQLite file |
| 2 | Schema and Migrations | Drizzle schema for Users, Contacts, Deals, Tasks, InteractionLogs; initial migration generated and applied | Migration runs without error; all tables exist with correct columns and foreign keys verified via `drizzle-kit studio` or raw SQL inspection |
| 3 | Auth | Better Auth integrated with Hono; email and password registration and login; session tokens returned; protected route middleware. Adds three supporting tables (sessions, accounts, verifications) and extends users with email_verified and image. | `POST /auth/register` and `POST /auth/login` work; protected routes return 401 without a valid token; tokens are validated correctly |
| 4 | Contacts API | CRUD endpoints for contacts; search and filter by name, email, company; pagination | All CRUD operations return correct status codes and payloads; filter and search return correct subsets; pagination tokens work correctly |
| 5 | Deals API | CRUD for deals; deal stages (new, qualified, won, lost); assign owner (user); link to contact | Stage transitions persist correctly; owner assignment validated against Users table; deal returns linked contact data |
| 6 | Tasks API | CRUD for tasks; link to contact or deal; due date; completion status | Tasks linked to non-existent records are rejected; overdue tasks retrievable via filter; completion toggle persists |
| 7 | Interaction Logs API | Append-only log entries (email, call, meeting, note); linked to contact or deal; timestamps | Log entries cannot be updated or deleted; entries are returned in chronological order; linked entity validation enforced |
| 8 | Pipeline Endpoint | `GET /pipeline` returns deals grouped by stage with counts and totals; optionally filtered by owner | Response shape matches Kanban-compatible format; stage grouping is accurate; owner filter scopes correctly |
| 9 | Reporting Endpoints | Endpoints for leads added per period, deals won and lost, upcoming tasks count | Metrics are accurate against seeded test data; date range parameters work; empty ranges return zero values not errors |
| 10 | API Token Support | Generate long-lived API tokens per user for dashboard integration; token auth middleware alongside session auth | Token grants same access as session for authorized routes; tokens can be revoked; revoked tokens return 401 immediately |

---
