# Basis CRM API

Basis is a lean, self-hosted CRM API for managing contacts, deals, tasks, and
interaction logs. It is single-tenant: any authenticated user can read any
record, but only the owner of a record can modify or delete it.

- **Base URL:** `http://localhost:3000` (local development)
- **Auth methods:** session cookie (browser/interactive use) or a long-lived
  API token passed as a Bearer token (service/CI use)
- **Machine-readable spec:** the full OpenAPI 3.1 document is served at
  `GET /openapi.json` whenever the server is running.

---

## Authentication

Basis supports two authentication methods:

1. **Session cookie** — obtained via `POST /auth/register` or
   `POST /auth/login`. The server sets a `better-auth.session_token` cookie
   which is sent automatically by browsers on subsequent requests.
2. **API token (Bearer)** — a long-lived token (prefix `basis_`) created via
   `POST /api-tokens` (session auth required to create one). Pass it as:

   ```
   Authorization: Bearer basis_xxxxxxxxxxxx
   ```

Endpoints that accept either method list both `SessionCookie` and `Bearer`
as valid security schemes. A few endpoints (creating API tokens) require a
session and explicitly reject Bearer tokens — see the API Tokens section.

An unauthenticated or invalid-credential request to a protected endpoint
returns `401` with the shape:

```json
{ "error": "string" }
```

---

## Pagination

List endpoints (`contacts`, `deals`, `tasks`, `interaction-logs`) share a
common pagination shape. Requests accept `limit` and `offset` query
parameters (both optional strings, parsed as numbers); responses include a
`pagination` object alongside `data`:

```json
{
  "data": [ /* ... */ ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 42
  }
}
```

---

## Ownership model

Any authenticated user can **read** any record (contacts, deals, tasks,
interaction logs, API tokens belonging to other users are not listable, but
reads of individual resources are shared). Only the `ownerId` of a record may
**update or delete** it. When a write is attempted by a non-owner, the
record's existence is checked first: a request for a record that does not
exist returns `404`; a request for a record that exists but is owned by
someone else returns `403`. In other words, `404` takes precedence over `403`
only when the record truly does not exist — ownership is never leaked via a
different status code for a record you can't see.

---

## Auth (`/auth/*`)

### POST /auth/register

Create a new user account and start a session.

- **Auth:** none
- **Body:** `email` (string, required), `password` (string, required),
  `name` (string, required)
- **Response:** `200` `{ "user": AuthUser, "session": AuthSession }`
- **Errors:** `400` `{ "message": string, "code": string }` — invalid
  request or email already in use

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123","name":"Alice"}'
```

### POST /auth/login

Authenticate with email and password and start a session.

- **Auth:** none
- **Body:** `email` (string, required), `password` (string, required)
- **Response:** `200` `{ "user": AuthUser, "session": AuthSession }`
- **Errors:** `401` `{ "message": string }` — invalid credentials

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

### GET /auth/me

Return the identity of the currently authenticated user.

- **Auth:** session or token
- **Response:** `200` `{ "id": string, "email": string, "name": string }`
- **Errors:** `401` `{ "error": string }`

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

---

## Contacts

### POST /contacts

Create a new contact owned by the current user.

- **Auth:** session or token
- **Body:** `name` (string, required), `email` (string, optional), `phone`
  (string, optional), `company` (string, optional), `notes` (string,
  optional)
- **Response:** `201` `{ "data": Contact }`
- **Errors:** `400` missing required fields, `401` unauthorized

```bash
curl -X POST http://localhost:3000/contacts \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","phone":"555-0100","company":"Acme Corp","notes":"Met at conference"}'
```

### GET /contacts

List contacts, paginated.

- **Auth:** session or token
- **Query:** `search` (string, optional), `company` (string, optional),
  `limit` (string, optional), `offset` (string, optional)
- **Response:** `200` `{ "data": Contact[], "pagination": Pagination }`
- **Errors:** `401` unauthorized

```bash
curl "http://localhost:3000/contacts?search=Jane&company=Acme&limit=25&offset=0" \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### GET /contacts/{id}

Get a single contact by id.

- **Auth:** session or token
- **Response:** `200` `{ "data": Contact }`
- **Errors:** `401` unauthorized, `404` contact not found

```bash
curl http://localhost:3000/contacts/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### PUT /contacts/{id}

Update a contact. Only the owner may update.

- **Auth:** session or token
- **Body:** `name` (string, optional), `email` (string|null, optional),
  `phone` (string|null, optional), `company` (string|null, optional), `notes`
  (string|null, optional)
- **Response:** `200` `{ "data": Contact }`
- **Errors:** `400` invalid request body, `401` unauthorized, `403` not
  owner, `404` contact not found

```bash
curl -X PUT http://localhost:3000/contacts/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Updated notes"}'
```

### DELETE /contacts/{id}

Delete a contact. Only the owner may delete.

- **Auth:** session or token
- **Response:** `204` no content
- **Errors:** `401` unauthorized, `403` not owner, `404` contact not found

```bash
curl -X DELETE http://localhost:3000/contacts/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

---

## Deals

Deal `stage` is one of `new`, `qualified`, `won`, `lost`.

### POST /deals

Create a new deal owned by the current user.

- **Auth:** session or token
- **Body:** `title` (string, required), `stage` (enum, optional), `value`
  (number, optional), `contact_id` (string, optional)
- **Response:** `201` `{ "data": Deal }`
- **Errors:** `400` missing title, invalid stage, or invalid contact, `401`
  unauthorized

```bash
curl -X POST http://localhost:3000/deals \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"title":"Big Deal","stage":"new","value":1000,"contact_id":"ckly1x7s2000001qexxx"}'
```

### GET /deals

List deals, paginated.

- **Auth:** session or token
- **Query:** `stage` (enum, optional), `owner_id` (string, optional),
  `limit` (string, optional), `offset` (string, optional)
- **Response:** `200` `{ "data": Deal[], "pagination": Pagination }`
- **Errors:** `401` unauthorized

```bash
curl "http://localhost:3000/deals?stage=won&limit=25&offset=0" \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### GET /deals/{id}

Get a single deal by id, including an embedded contact summary.

- **Auth:** session or token
- **Response:** `200` `{ "data": DealWithContact }`
- **Errors:** `401` unauthorized, `404` deal not found

```bash
curl http://localhost:3000/deals/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### PUT /deals/{id}

Update a deal. Only the owner may update.

- **Auth:** session or token
- **Body:** `title` (string, optional), `stage` (enum, optional), `value`
  (number, optional), `contact_id` (string|null, optional)
- **Response:** `200` `{ "data": Deal }`
- **Errors:** `400` invalid stage or contact, `401` unauthorized, `403` not
  owner, `404` deal not found

```bash
curl -X PUT http://localhost:3000/deals/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"stage":"won","value":2000}'
```

### DELETE /deals/{id}

Delete a deal. Only the owner may delete.

- **Auth:** session or token
- **Response:** `204` no content
- **Errors:** `401` unauthorized, `403` not owner, `404` deal not found

```bash
curl -X DELETE http://localhost:3000/deals/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

---

## Tasks

### POST /tasks

Create a new task owned by the current user.

- **Auth:** session or token
- **Body:** `title` (string, required), `due_at` (number, optional),
  `contact_id` (string, optional), `deal_id` (string, optional)
- **Response:** `201` `{ "data": Task }`
- **Errors:** `400` missing title, invalid due_at, or invalid reference,
  `401` unauthorized

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"title":"Follow up","due_at":1700000000000,"contact_id":"ckly1x7s2000001qexxx"}'
```

### GET /tasks

List tasks, paginated.

- **Auth:** session or token
- **Query:** `completed` (enum `"true"`/`"false"`, optional), `owner_id`
  (string, optional), `contact_id` (string, optional), `deal_id` (string,
  optional), `overdue` (enum `"true"`, optional), `limit` (string,
  optional), `offset` (string, optional)
- **Response:** `200` `{ "data": Task[], "pagination": Pagination }`
- **Errors:** `401` unauthorized

```bash
curl "http://localhost:3000/tasks?completed=false&overdue=true&limit=25&offset=0" \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### GET /tasks/{id}

Get a single task by id.

- **Auth:** session or token
- **Response:** `200` `{ "data": Task }`
- **Errors:** `401` unauthorized, `404` task not found

```bash
curl http://localhost:3000/tasks/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### PUT /tasks/{id}

Update a task. Only the owner may update.

- **Auth:** session or token
- **Body:** `title` (string, optional), `due_at` (number, optional),
  `completed` (boolean, optional), `contact_id` (string|null, optional),
  `deal_id` (string|null, optional)
- **Response:** `200` `{ "data": Task }`
- **Errors:** `400` invalid due_at or reference, `401` unauthorized, `403`
  not owner, `404` task not found

```bash
curl -X PUT http://localhost:3000/tasks/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
```

### DELETE /tasks/{id}

Delete a task. Only the owner may delete.

- **Auth:** session or token
- **Response:** `204` no content
- **Errors:** `401` unauthorized, `403` not owner, `404` task not found

```bash
curl -X DELETE http://localhost:3000/tasks/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

---

## Interaction Logs

Interaction log `type` is one of `email`, `call`, `meeting`, `note`. Logs are
immutable once created — there is no update endpoint.

### POST /interaction-logs

Create a new interaction log entry, logged by the current user.

- **Auth:** session or token
- **Body:** `type` (enum, required), `body` (string, required), `contact_id`
  (string, optional), `deal_id` (string, optional) — at least one of
  `contact_id`/`deal_id` is required
- **Response:** `201` `{ "data": InteractionLog }`
- **Errors:** `400` invalid type, missing body, or missing
  contact_id/deal_id, `401` unauthorized

```bash
curl -X POST http://localhost:3000/interaction-logs \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"type":"call","body":"Discussed pricing","contact_id":"ckly1x7s2000001qexxx"}'
```

### GET /interaction-logs

List interaction logs, paginated.

- **Auth:** session or token
- **Query:** `contact_id` (string, optional), `deal_id` (string, optional),
  `type` (enum, optional), `logged_by` (string, optional), `limit` (string,
  optional), `offset` (string, optional)
- **Response:** `200` `{ "data": InteractionLog[], "pagination": Pagination }`
- **Errors:** `401` unauthorized

```bash
curl "http://localhost:3000/interaction-logs?type=call&limit=25&offset=0" \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### GET /interaction-logs/{id}

Get a single interaction log entry by id.

- **Auth:** session or token
- **Response:** `200` `{ "data": InteractionLog }`
- **Errors:** `401` unauthorized, `404` log entry not found

```bash
curl http://localhost:3000/interaction-logs/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

---

## Pipeline

### GET /pipeline

Return all deals grouped by stage (`new`, `qualified`, `won`, `lost`), each
with a count and value total, plus an overall summary. All four stages are
always present in the response, even if empty.

- **Auth:** session or token
- **Query:** `owner_id` (string, optional)
- **Response:** `200` `{ "stages": { "new": StageSummary, "qualified": StageSummary, "won": StageSummary, "lost": StageSummary }, "summary": { "totalCount": number, "totalValue": number } }`
- **Errors:** `401` unauthorized

```bash
curl http://localhost:3000/pipeline \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

---

## Reports

### GET /reports/leads-added

Count of contacts created within a date range.

- **Auth:** session or token
- **Query:** `from` (string epoch ms, optional), `to` (string epoch ms,
  optional)
- **Response:** `200` `{ "count": number, "from": number, "to": number }`
  — `count` is `0`, not an error, when nothing matches the range
- **Errors:** `400` invalid date range, `401` unauthorized

```bash
curl "http://localhost:3000/reports/leads-added?from=1700000000000&to=1700086400000" \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### GET /reports/deals-summary

Won/lost deal counts and value totals within a date range.

- **Auth:** session or token
- **Query:** `from` (string epoch ms, optional), `to` (string epoch ms,
  optional)
- **Response:** `200` `{ "won": { "count": number, "total": number }, "lost": { "count": number, "total": number }, "from": number, "to": number }`
- **Errors:** `400` invalid date range, `401` unauthorized

```bash
curl "http://localhost:3000/reports/deals-summary?from=1700000000000&to=1700086400000" \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### GET /reports/upcoming-tasks

Count of incomplete tasks with a future due date.

- **Auth:** session or token
- **Response:** `200` `{ "count": number }`
- **Errors:** `401` unauthorized

```bash
curl http://localhost:3000/reports/upcoming-tasks \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

---

## API Tokens

Tokens are prefixed `basis_`, have no expiration, and are only ever shown in
full at creation time.

### POST /api-tokens

Create a new API token for the current user. Requires session
authentication — a Bearer token cannot be used to create another token.

- **Auth:** session only
- **Body:** `name` (string, required)
- **Response:** `201` `{ "data": ApiToken }` — the full token `key` is only
  returned here
- **Errors:** `400` missing name, `401` unauthorized, `403` session required
  (bearer token rejected)

```bash
curl -X POST http://localhost:3000/api-tokens \
  -b "better-auth.session_token=xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"ci-token"}'
```

### GET /api-tokens

List API tokens belonging to the current user (without the secret key).

- **Auth:** session or token
- **Response:** `200` `{ "data": ListedToken[] }`
- **Errors:** `401` unauthorized

```bash
curl http://localhost:3000/api-tokens \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```

### DELETE /api-tokens/{id}

Delete an API token. Only the owner may delete.

- **Auth:** session or token
- **Response:** `204` no content
- **Errors:** `401` unauthorized, `403` not owner, `404` token not found

```bash
curl -X DELETE http://localhost:3000/api-tokens/ckly1x7s2000001qexxx \
  -H "Authorization: Bearer basis_xxxxxxxxxxxx"
```
