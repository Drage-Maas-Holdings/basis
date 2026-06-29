# Basis CRM

A lean, API-first CRM module for companies that need contact management, a deal pipeline, and interaction history without the overhead of a full CRM platform.

Built to be self-hosted, embedded into existing dashboards, or consumed as a standalone API service.

---

## What it is

Basis is a single-tenant CRM backend that exposes a clean REST API. It is not a SaaS product and it does not try to be. It is designed for internal use at a single company and built to be owned entirely by the team running it.

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

No external services required. SQLite runs from a Docker-mounted volume. The entire stack can be brought up with a single command.

---

## Getting started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+

### Running locally

```bash
git clone https://github.com/your-org/basis-crm.git
cd basis-crm
cp .env.example .env
docker compose up
```

The API will be available at `http://localhost:3000`.

Verify the service is running:

```bash
curl http://localhost:3000/health
```

### Running migrations

```bash
npm run db:migrate
```

To inspect the schema locally:

```bash
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

Schema is defined in `src/db/schema.ts` and versioned via Drizzle migration files in `drizzle/`.

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
