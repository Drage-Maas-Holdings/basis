# Basis CRM

A lean, self-hosted CRM for small teams that want contact management and a deal pipeline without the overhead of a full CRM platform.

Ships as two services — an API and a web GUI — both defined in a monorepo and started with a single command.

---

## What it is

Basis is a single-tenant CRM built to be owned entirely by the team running it. It is not a SaaS product. It runs on your own infrastructure, stores data in a SQLite file you control, and exposes a clean REST API for integration with external tools like n8n or custom dashboards.

Core capabilities:

- Contact management (name, email, phone, company, notes)
- Deal pipeline with stages: new, qualified, won, lost
- Task reminders tied to contacts or deals
- Interaction logs for emails, calls, meetings, and notes
- Pipeline endpoint with Kanban-compatible grouping
- Reporting: leads added, deals won/lost, upcoming tasks
- API token support for service-to-service integration

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Framework | Hono |
| Auth | Better Auth |
| ORM | Drizzle |
| Database | SQLite (better-sqlite3) |
| Containerization | Docker Compose |

No external services required. SQLite runs from a Docker-mounted volume. The entire stack runs from one `docker compose up`.

---

## Monorepo structure

```
basis/
  api/        # Hono REST API
  web/        # Web GUI
  docker-compose.yml
```

---

## Getting started

### Prerequisites

- Docker and Docker Compose
- Node.js 22+

### Running locally

```bash
git clone https://github.com/Drage-Maas-Holdings/basis.git
cd basis
cp api/.env.example api/.env
docker compose up
```

The API will be available at `http://localhost:3000` and the web GUI at `http://localhost:5173`.

Verify the API is running:

```bash
curl http://localhost:3000/health
```

### Migrations

Migrations run automatically on container start. To run them manually:

```bash
cd api
npm run db:migrate
```

To inspect the schema:

```bash
cd api
npm run db:studio
```

---

## Configuration

All configuration is via environment variables in `api/.env`. Copy `api/.env.example` and fill in values before starting.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Absolute path to the SQLite file inside the container (e.g. `/data/basis.db`) |
| `BETTER_AUTH_SECRET` | Secret used to sign session tokens. Must be strong and kept private. |
| `BETTER_AUTH_URL` | Base URL the API is reachable at (e.g. `http://localhost:3000`) |
| `SESSION_EXPIRY_SECONDS` | Session token lifetime in seconds (default: `604800` — 7 days) |
| `PORT` | Port the API listens on (default: `3000`) |

---

## API overview

All endpoints require authentication via session cookie or API token. Full API documentation is available in [`docs/api.md`](./docs/api.md). A machine-readable OpenAPI 3.1 spec is also available at `GET /openapi.json` when the server is running.

### Auth

```
POST   /auth/register
POST   /auth/login
GET    /auth/me
```

### Resources

```
GET    /contacts
POST   /contacts
GET    /contacts/:id
PUT    /contacts/:id
DELETE /contacts/:id

GET    /deals
POST   /deals
GET    /deals/:id
PUT    /deals/:id
DELETE /deals/:id

GET    /tasks
POST   /tasks
GET    /tasks/:id
PUT    /tasks/:id
DELETE /tasks/:id

GET    /interaction-logs
POST   /interaction-logs
GET    /interaction-logs/:id
```

### Aggregations

```
GET    /pipeline
GET    /reports/leads-added
GET    /reports/deals-summary
GET    /reports/upcoming-tasks
```

### API tokens

```
POST   /api-tokens
GET    /api-tokens
DELETE /api-tokens/:id
```

---

## Authentication

Basis uses Better Auth for session-based login. For service-to-service integration (n8n, dashboards, automation), long-lived API tokens can be generated per user and passed via:

```
Authorization: Bearer <token>
```

Tokens do not expire and are valid until explicitly revoked. Revocation takes effect immediately. Tokens are managed via the `/api-tokens` endpoints and require a session to create, preventing a leaked token from being used to mint further tokens.

---

## Data model

Eight tables in total:

- `users` — registered users
- `contacts` — people and companies
- `deals` — opportunities linked to contacts, with stage tracking
- `tasks` — follow-up items linked to contacts or deals
- `interaction_logs` — append-only record of all communications
- `sessions`, `accounts`, `verifications` — Better Auth internals
- `apikey` — API tokens managed by Better Auth's API key plugin

Schema is defined in `api/src/db/schema.ts` and versioned via Drizzle migration files in `api/src/db/migrations/`.

---

## Ownership model

Basis uses a single-team model with no multi-tenancy. Any authenticated user can read any record (contacts, deals, tasks, logs). Write access (update and delete) is restricted to the record's owner.

---

## Self-hosting

Basis is designed to run as a Docker service. The `docker-compose.yml` in the root mounts a local volume for the SQLite database so data persists across container restarts. The API port is bound to `127.0.0.1` only and is not publicly exposed.

For production:

- Mount the SQLite volume to a durable storage path
- Put the API behind a reverse proxy (nginx, Caddy) with TLS termination
- Set a strong `BETTER_AUTH_SECRET` and keep it out of version control
- Back up the SQLite file on a regular schedule
- If n8n or your dashboard run on a separate server, use a private network or Wireguard tunnel rather than exposing the API port publicly

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for anything beyond small bug fixes, so the change can be discussed first. New or changed routes must include Zod schemas and appear in the OpenAPI spec (`GET /openapi.json`) before a PR will be accepted.

---

## License

MIT