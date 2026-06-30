# Basis CRM

A lean, self-hosted CRM that ships an API and a web GUI — contact management, a deal pipeline, and interaction history without the overhead of a full CRM platform.

Built to be self-hosted, with both services running from a single Docker Compose file.

---

## What it is

Basis is a single-tenant CRM that ships as two services — an API and a web GUI — both defined in a monorepo at `api/` and `web/`. It is not a SaaS product and it does not try to be. It is designed for internal use at a single company and built to be owned entirely by the team running it.

Core capabilities:

- Contact management (name, email, phone, company, notes)
- Deal pipeline with stages: new, qualified, won, lost
- Task reminders tied to contacts or deals
- Interaction logs for emails, calls, meetings, and notes
- Pipeline endpoint with Kanban-compatible grouping
- Basic reporting: leads added, deals won/lost, upcoming tasks
- API token support for dashboard and third-party integration

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Hono |
| Auth | Better Auth |
| ORM | Drizzle |
| Database | SQLite |
| Containerization | Docker Compose |

No external services required. SQLite runs from a Docker-mounted volume. Both services can be brought up with a single command.

---

## Getting started

### Prerequisites

- Docker and Docker Compose
- Node.js 22+

### Running locally

```bash
git clone https://github.com/Drage-Maas-Holdings/basis.git
cd basis
cp .env.example .env
docker compose up
```

The API will be available at `http://localhost:3000` and the web GUI at `http://localhost:5173`.

Verify the API is running:

```bash
curl http://localhost:3000/health
```

### Running migrations

```bash
cd api
npm run db:migrate
```

To inspect the schema locally:

```bash
cd api
npm run db:studio
```

---

## API overview

All endpoints require authentication via session token or API token. Tokens are issued through the auth endpoints.

```
POST   /auth/register
POST   /auth/login

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
PUT    /tasks/:id
DELETE /tasks/:id

GET    /logs
POST   /logs

GET    /pipeline
GET    /reports
```

Full API documentation is available in [`docs/api.md`](./docs/api.md).

---

## Configuration

All configuration is via environment variables. Copy `.env.example` and fill in values before starting.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Path to the SQLite file |
| `BETTER_AUTH_SECRET` | Secret used to sign session tokens |
| `PORT` | Port the API listens on (default: 3000) |

---

## Data model

Four core collections:

- `contacts` — people and companies
- `deals` — opportunities linked to contacts, with stage tracking
- `tasks` — follow-up items linked to contacts or deals
- `interaction_logs` — append-only record of all communications

Schema is defined in `api/src/db/schema.ts` and versioned via Drizzle migration files in `api/src/db/migrations/`.

---

## Authentication

Basis uses Better Auth for session-based authentication. For dashboard or service integration, long-lived API tokens can be generated per user and passed via the `Authorization: Bearer` header.

Tokens can be revoked at any time. Revoked tokens are rejected immediately.

---

## Self-hosting

Basis is designed to run as a Docker service. The `docker-compose.yml` in the root mounts a local volume for the SQLite database so data persists across container restarts.

For production, you should:

- Mount the SQLite volume to a durable storage path
- Put the service behind a reverse proxy (nginx, Caddy) with TLS termination
- Set a strong `BETTER_AUTH_SECRET`
- Back up the SQLite file on a regular schedule

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for anything beyond small bug fixes, so the change can be discussed first.

---

## License

MIT
