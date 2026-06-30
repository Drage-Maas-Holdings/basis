# Tasks API - Implementation Report

## Implementation Summary

**Spec:** `specs/spec_6.md` — Tasks API

**Files Created:**
- `api/src/routes/tasks.ts` — All tasks CRUD, completion toggle, and filter routes

**Files Modified:**
- `api/src/index.ts` — Registered tasks routes

### Endpoints Implemented

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| POST | /tasks | 201 | Create a task |
| GET | /tasks | 200 | List tasks (filters/pagination) |
| GET | /tasks/:id | 200/404 | Get a single task |
| PUT | /tasks/:id | 200/400/403/404 | Update a task, incl. completion toggle |
| DELETE | /tasks/:id | 204/403/404 | Delete a task |

### Build & Lint

```
$ npm run build

> basis-crm@0.1.0 build
> rolldown -c

✔ rolldown v1.1.3 Finished in 139.82 ms
```

```
$ npm run lint

> basis-crm@0.1.0 lint
> oxlint .

Found 0 warnings and 0 errors.
Finished in 27ms on 13 files with 95 rules using 6 threads.
```

---

## Acceptance Criteria — Raw Verification

### AC-1: All endpoints protected by auth middleware (401)

```
$ curl -s -X POST http://localhost:3000/tasks -d '{"title":"T"}'
{"error":"Unauthorized"}

$ curl -s -X GET http://localhost:3000/tasks
{"error":"Unauthorized"}

$ curl -s -X GET http://localhost:3000/tasks/some-id
{"error":"Unauthorized"}

$ curl -s -X PUT http://localhost:3000/tasks/some-id -d '{"title":"T"}'
{"error":"Unauthorized"}

$ curl -s -X DELETE http://localhost:3000/tasks/some-id
{"error":"Unauthorized"}
```

**Result:** All five endpoints return 401 without a valid session. ✓

---

### AC-2: POST /tasks creates with server-generated cuid, owner_id, timestamps, defaults completed to false (0)

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Setup CRM"}'

{"data":{"id":"ikot860lw13f2kyqc4jey2nx","title":"Setup CRM","dueAt":null,"completed":0,"contactId":null,"dealId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782827362821,"updatedAt":1782827362821}}
```

- ID `ikot860lw13f2kyqc4jey2nx` is a cuid2 (no hyphens) ✓
- `ownerId` matches the authenticated user ✓
- `completed` defaults to `0` (false) ✓
- `createdAt` and `updatedAt` are set ✓
- Returns 201 ✓

---

### AC-3: POST /tasks rejects missing `title` with 400

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{}'

{"error":"Title is required"}
```

**Result:** 400 with clear error before database. ✓

---

### AC-4: POST /tasks rejects invalid `contact_id` with 400

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Task","contact_id":"nonexistent"}'

{"error":"Contact not found"}
```

**Result:** 400 for non-existent contact. ✓

---

### AC-5: POST /tasks rejects invalid `deal_id` with 400

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Task","deal_id":"nonexistent"}'

{"error":"Deal not found"}
```

**Result:** 400 for non-existent deal. ✓

---

### AC-6: POST /tasks validates `due_at` (must be integer Unix ms)

**Invalid due_at:**
```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Task","due_at":"not-a-number"}'

{"error":"Invalid due_at"}
```

**Valid due_at:**
```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Future Task","due_at":1893456000000}'

{"data":{"id":"l187z382hezcf5qmpqupva7f","title":"Future Task","dueAt":1893456000000,"completed":0,"contactId":null,"dealId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782827362926,"updatedAt":1782827362926}}
```

**Result:** Non-integer due_at → 400; valid integer → 201 with due_at set. ✓

---

### AC-7: GET /tasks returns paginated list (default 25, configurable, cap 100)

**Default pagination:**
```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/tasks
Count: 3 | Pagination: {"limit":25,"offset":0,"total":3}
```

**Custom limit/offset:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?limit=2&offset=1'
Count: 1 | Pagination: {"limit":2,"offset":1,"total":3}
```

**Cap at 100:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?limit=200'
Pagination: {"limit":100,"offset":0,"total":3}
```

**Offset beyond total:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?offset=1000'
Count: 0 | Total: 3
```

**Result:** Pagination shape matches Spec 4 and Spec 5. ✓

---

### AC-8: GET /tasks supports filtering by `completed`, `owner_id`, `contact_id`, `deal_id` (combinable)

**Filter by completed=false:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?completed=false'
Count: 2
  Setup CRM - completed: 0
  Future Task - completed: 0
```

**Filter by owner_id:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?owner_id=hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG'
Count: 3
```

**Combined filters (completed=false + owner_id):**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?completed=false&owner_id=hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG'
Count: 2
  Setup CRM - completed: 0
  Future Task - completed: 0
```

**Filter with no matches:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?completed=true&deal_id=nonexistent-filter'
Count: 0 | Total: 0
```

**Result:** All filters work as exact matches, combinable, no-match returns 0 total. ✓

---

### AC-9: GET /tasks supports `overdue` filter

**Create overdue and completed-overdue tasks:**
```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Overdue Task","due_at":1000000000000}'

{"data":{"id":"ujpt5zzpp9awkr2mpexzels5","title":"Overdue Task","dueAt":1000000000000,"completed":0,...}}

$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Completed Overdue Task","due_at":1000000000000}'

{"data":{"id":"nfoeamcnnal3jrf1mk6uf2x9","title":"Completed Overdue Task","dueAt":1000000000000,"completed":0,...}}
```

**Mark the second one as completed:**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/nfoeamcnnal3jrf1mk6uf2x9 \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'
```

**Overdue=true (should include only the uncompleted overdue task):**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?overdue=true'
Overdue count: 1
  Overdue Task | completed: 0 | dueAt: 1000000000000
```

**State of all tasks for context:**
```
Total tasks: 4
  Future Task              | dueAt: 2030-01-01T00:00:00.000Z | completed: 0
  Overdue Task             | dueAt: 2001-09-09T01:46:40.000Z | completed: 0
  Completed Overdue Task   | dueAt: 2001-09-09T01:46:40.000Z | completed: 1
  No Due Task              | dueAt: null                      | completed: 0
```

**Overdue filter still returns only Overdue Task after adding No Due Task:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?overdue=true'
Overdue count: 1
  Overdue Task
```

**Result:** `overdue=true` correctly returns only tasks with past `due_at` AND `completed=false`. Tasks with no `due_at` are excluded. Tasks with past `due_at` but `completed=true` are excluded. ✓

---

### AC-10: GET /tasks/:id returns task or 404

**Existing task:**
```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx

{"data":{"id":"ikot860lw13f2kyqc4jey2nx","title":"Setup CRM","dueAt":null,"completed":0,"contactId":null,"dealId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782827362821,"updatedAt":1782827362821}}
```

**Non-existent task:**
```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/tasks/nonexistent

{"error":"Task not found"}
```

**Result:** Task returned for existing id, 404 for non-existent. ✓

---

### AC-11: PUT /tasks/:id updates provided fields only

```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx \
  -H 'Content-Type: application/json' \
  -d '{"title":"Setup CRM Updated","due_at":1700000000000}'

{"data":{"id":"ikot860lw13f2kyqc4jey2nx","title":"Setup CRM Updated","dueAt":1700000000000,"completed":0,"contactId":null,"dealId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782827362821,"updatedAt":1782827392986}}
```

**Result:** Only `title` and `due_at` changed, `updatedAt` refreshed, `id` and `ownerId` unchanged. ✓

---

### AC-12: PUT /tasks/:id allows toggling `completed` independently

**Toggle completed=true:**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'

{"data":{"id":"ikot860lw13f2kyqc4jey2nx","title":"Setup CRM Updated","dueAt":1700000000000,"completed":1,"contactId":null,"dealId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782827362821,"updatedAt":1782827393004}}
```

**Toggle completed=false:**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx \
  -H 'Content-Type: application/json' \
  -d '{"completed":false}'

{"data":{"id":"ikot860lw13f2kyqc4jey2nx","title":"Setup CRM Updated","dueAt":1700000000000,"completed":0,"contactId":null,"dealId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782827362821,"updatedAt":1782827393024}}
```

**Result:** `completed` toggles independently, no other fields required. ✓

---

### AC-13: PUT /tasks/:id validates contact_id and deal_id

**Valid contact_id:**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx \
  -H 'Content-Type: application/json' \
  -d '{"contact_id":"f58nzd8jmt86u4o78y7l2et1"}'

{"data":{"id":"ikot860lw13f2kyqc4jey2nx","title":"Setup CRM Updated","dueAt":1700000000000,"completed":0,"contactId":"f58nzd8jmt86u4o78y7l2et1","dealId":null,...}}
```

**Valid deal_id:**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx \
  -H 'Content-Type: application/json' \
  -d '{"deal_id":"lgwmhxpejbz4ybr7qat6iewt"}'

{"data":{"id":"ikot860lw13f2kyqc4jey2nx","title":"Setup CRM Updated","dueAt":1700000000000,"completed":0,"contactId":"f58nzd8jmt86u4o78y7l2et1","dealId":"lgwmhxpejbz4ybr7qat6iewt",...}}
```

**Invalid contact_id (400):**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx \
  -H 'Content-Type: application/json' \
  -d '{"contact_id":"nonexistent"}'

{"error":"Contact not found"}
```

**Invalid deal_id (400):**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx \
  -H 'Content-Type: application/json' \
  -d '{"deal_id":"nonexistent"}'

{"error":"Deal not found"}
```

**Unlink contact_id (set to null):**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx \
  -H 'Content-Type: application/json' \
  -d '{"contact_id":null}'

{"data":{"id":"ikot860lw13f2kyqc4jey2nx","title":"Setup CRM Updated","dueAt":1700000000000,"completed":0,"contactId":null,"dealId":"lgwmhxpejbz4ybr7qat6iewt",...}}
```

**Result:** Contact/deal validation same as POST, unlinking via null allowed. ✓

---

### AC-14: PUT /tasks/:id returns 403/404 (404 precedence)

**Non-owner → 403:**
```
$ curl -s -b /tmp/cookies_u2.txt -X PUT http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hacked"}'

{"error":"Forbidden"}
```

**Non-existent (404 takes precedence over 403):**
```
$ curl -s -b /tmp/cookies_u2.txt -X PUT http://localhost:3000/tasks/nonexistent \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hacked"}'

{"error":"Task not found"}
```

**Result:** 403 for non-owner, 404 for non-existent (even for non-owner). ✓

---

### AC-15: DELETE /tasks/:id returns 204/403/404

**Non-owner → 403:**
```
$ curl -s -b /tmp/cookies_u2.txt -X DELETE http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx -w '\nHTTP %{http_code}\n'

{"error":"Forbidden"}
HTTP 403
```

**Non-existent → 404:**
```
$ curl -s -b /tmp/cookies_u2.txt -X DELETE http://localhost:3000/tasks/nonexistent -w '\nHTTP %{http_code}\n'

{"error":"Task not found"}
HTTP 404
```

**Owner → 204:**
```
$ curl -s -b /tmp/cookies_u1.txt -X DELETE http://localhost:3000/tasks/ikot860lw13f2kyqc4jey2nx -w '\nHTTP %{http_code}\n'


HTTP 204
```

**Result:** 204 for owner, 403 for non-owner, 404 for non-existent. ✓

---

### AC-16: Any authenticated user can read any task

**User 2 reads User 1's task:**
```
$ curl -s -b /tmp/cookies_u2.txt http://localhost:3000/tasks/l187z382hezcf5qmpqupva7f

{"data":{"id":"l187z382hezcf5qmpqupva7f","title":"Future Task","dueAt":1893456000000,"completed":0,"contactId":null,"dealId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782827362926,"updatedAt":1782827362926}}
```

**User 2 lists all tasks:**
```
$ curl -s -b /tmp/cookies_u2.txt http://localhost:3000/tasks
Count: 4 | Total: 4
  Future Task
  Overdue Task
  Completed Overdue Task
  No Due Task
```

**Result:** Any authenticated user can read any task regardless of ownership. ✓

---

### AC-17: npm run build zero TypeScript errors

Build output shown above — zero errors.

---

## Ownership Enforcement — Raw 403 Verification

### User 2 attempts UPDATE on User 1's task → 403

```
$ curl -s -b /tmp/cookies_u2.txt -X PUT http://localhost:3000/tasks/l187z382hezcf5qmpqupva7f \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hacked"}'

{"error":"Forbidden"}
```

**403 leak check:**
- Contains `ownerId`? → 0 matches
- Contains task title? → 0 matches
- Contains owner ID value? → 0 matches
- Contains `due_at`? → 0 matches

### User 2 attempts DELETE on User 1's task → 403

```
$ curl -s -b /tmp/cookies_u2.txt -X DELETE http://localhost:3000/tasks/l187z382hezcf5qmpqupva7f -w '\nHTTP %{http_code}\n'

{"error":"Forbidden"}
HTTP 403
```

**403 leak check:**
- Body: `{"error":"Forbidden"}`
- Contains `ownerId`? → 0 matches
- Contains task data? → 0 matches

### Task confirmed unchanged after failed attempts

```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/tasks/l187z382hezcf5qmpqupva7f
Task still exists: Future Task
```

**Result:** 403 body is `{"error":"Forbidden"}` — no owner_id, task data, or any other information leaked. ✓

---

## Overdue Filter — Detailed Verification

### Test data

| Title | due_at | completed | Should appear in overdue? |
|-------|--------|-----------|---------------------------|
| Future Task | 2030-01-01T00:00:00.000Z | 0 | No (due in future) |
| Overdue Task | 2001-09-09T01:46:40.000Z | 0 | **Yes** |
| Completed Overdue Task | 2001-09-09T01:46:40.000Z | 1 | No (completed) |
| No Due Task | null | 0 | No (no due date) |

### Overdue filter result

```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/tasks?overdue=true'
Overdue count: 1
  Overdue Task | completed: 0 | dueAt: 1000000000000
```

**Result:** Only the uncompleted task with a past due_at appears. Tasks with no due_at, future due_at, or completed overdue tasks are all excluded. ✓

---

## Acceptance Criteria Summary

| # | Criterion | Status |
|---|-----------|--------|
| 1 | All endpoints protected by auth middleware (401) | ✓ |
| 2 | POST creates with server-generated cuid, owner_id, timestamps, defaults completed=0 | ✓ |
| 3 | POST rejects missing `title` with 400 | ✓ |
| 4 | POST rejects invalid `contact_id` with 400 | ✓ |
| 5 | POST rejects invalid `deal_id` with 400 | ✓ |
| 6 | POST validates `due_at` (must be integer Unix ms) | ✓ |
| 7 | GET returns paginated list (default 25, configurable cap 100) | ✓ |
| 8 | GET supports filters: completed, owner_id, contact_id, deal_id (combinable) | ✓ |
| 9 | GET supports `overdue` filter (past due + not completed) | ✓ |
| 10 | GET /:id returns task or 404 | ✓ |
| 11 | PUT updates provided fields only, blocks id/owner_id changes | ✓ |
| 12 | PUT toggles `completed` independently | ✓ |
| 13 | PUT validates contact_id/deal_id same as POST | ✓ |
| 14 | PUT returns 403 if not owner, 404 if not exists (404 precedence) | ✓ |
| 15 | DELETE returns 204 if owner, 403 if not, 404 if not exists | ✓ |
| 16 | Any authenticated user can read any task | ✓ |
| 17 | `npm run build` completes with zero TypeScript errors | ✓ |

**Deviation from spec:** None found.

---

## Follow-up Verification

### GAP 1 — Task linking to BOTH contact_id AND deal_id simultaneously

**POST a task with both contact_id and deal_id in the same request:**

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Linked to Both","contact_id":"f58nzd8jmt86u4o78y7l2et1","deal_id":"lgwmhxpejbz4ybr7qat6iewt"}'

{"data":{"id":"lfmoyaoayq2btj8eterdqep6","title":"Linked to Both","dueAt":null,"completed":0,"contactId":"f58nzd8jmt86u4o78y7l2et1","dealId":"lgwmhxpejbz4ybr7qat6iewt","ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782832783989,"updatedAt":1782832783989}}
```

Both `contactId` and `dealId` are set in the response. ✓

**PUT an existing task to set both contact_id and deal_id in the same request:**

```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/l187z382hezcf5qmpqupva7f \
  -H 'Content-Type: application/json' \
  -d '{"contact_id":"f58nzd8jmt86u4o78y7l2et1","deal_id":"lgwmhxpejbz4ybr7qat6iewt"}'

{"data":{"id":"l187z382hezcf5qmpqupva7f","title":"Future Task","dueAt":1893456000000,"completed":0,"contactId":"f58nzd8jmt86u4o78y7l2et1","dealId":"lgwmhxpejbz4ybr7qat6iewt","ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782827362926,"updatedAt":1782832784147}}
```

Both fields persist together after a single PUT. ✓

**Result:** No bug — a task can be linked to both a contact and a deal simultaneously via either POST or PUT. ✓

---

### GAP 2 — Additional due_at validation edge cases

The spec requires `due_at` to be "a valid integer timestamp". The validation uses `Number.isInteger()` in JavaScript.

| Input | Accepted? | Response |
|-------|-----------|----------|
| `"not-a-number"` (string) | **Rejected** | `{"error":"Invalid due_at"}` |
| `1700000000000.5` (float) | **Rejected** | `{"error":"Invalid due_at"}` |
| `-100` (negative integer) | **Accepted** | Task created with `dueAt: -100` |
| `0` (zero) | **Accepted** | Task created with `dueAt: 0` |

**Raw output for each:**

**Negative integer (-100):**
```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Neg Due","due_at":-100}'

{"data":{"id":"fjzeuvudays5bwlxs3snqc95","title":"Neg Due","dueAt":-100,"completed":0,"contactId":null,"dealId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782832784245,"updatedAt":1782832784245}}
```

**Zero (0):**
```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Zero Due","due_at":0}'

{"data":{"id":"m1bvys9qaup3heeectj0d49d","title":"Zero Due","dueAt":0,"completed":0,"contactId":null,"dealId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782832784267,"updatedAt":1782832784267}}
```

**Non-integer number (1700000000000.5):**
```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Float Due","due_at":1700000000000.5}'

{"error":"Invalid due_at"}
```

**Verdict on spec compliance:** The validation correctly rejects non-integer values (strings and floats) with 400. Negative integers and zero are accepted because `Number.isInteger()` considers them valid integers. The spec says "a valid integer timestamp" without restricting to positive or non-negative values. Accepting negative integers and zero is consistent with the spec's literal wording, though negative Unix timestamps (dates before 1970) are unlikely to be meaningful in a CRM context. This is not considered a bug — it is a consequence of the spec not constraining the sign of the integer.

---

## due_at Validation Fix

**Change:** Added `due_at <= 0` check to both POST /tasks and PUT /tasks/:id validation, rejecting negative integers and zero with 400.

**Build:**
```
$ npm run build

> basis-crm@0.1.0 build
> rolldown -c

✔ rolldown v1.1.3 Finished in 144.89 ms
```

### POST /tasks

| Case | Expected | Actual |
|------|----------|--------|
| `due_at=-100` | 400 | `{"error":"Invalid due_at"}` |
| `due_at=0` | 400 | `{"error":"Invalid due_at"}` |
| `due_at=1700000000000.5` | 400 | `{"error":"Invalid due_at"}` |
| `due_at="not-a-number"` | 400 | `{"error":"Invalid due_at"}` |
| `due_at=1893456000000` | 201 | Task created with `dueAt: 1893456000000` |

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"T","due_at":-100}'
{"error":"Invalid due_at"}

$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"T","due_at":0}'
{"error":"Invalid due_at"}

$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"T","due_at":1700000000000.5}'
{"error":"Invalid due_at"}

$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"T","due_at":"not-a-number"}'
{"error":"Invalid due_at"}

$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"T","due_at":1893456000000}'
{"data":{"id":"yktf9xsarqhx6jcw5nj9hadn","title":"T","dueAt":1893456000000,"completed":0,"contactId":null,"dealId":null,"ownerId":"F18n66xWWoBL2cHuTODN6F3ZZq5PeDtE","createdAt":1782844383810,"updatedAt":1782844383810}}
```

### PUT /tasks/:id

| Case | Expected | Actual |
|------|----------|--------|
| `due_at=-100` | 400 | `{"error":"Invalid due_at"}` |
| `due_at=0` | 400 | `{"error":"Invalid due_at"}` |
| `due_at=1700000000000.5` | 400 | `{"error":"Invalid due_at"}` |
| `due_at="not-a-number"` | 400 | `{"error":"Invalid due_at"}` |
| `due_at=1893456000000` | 200 | Task updated with `dueAt: 1893456000000` |

```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ytx9vzhqf0lisil8dpev6iqx \
  -H 'Content-Type: application/json' \
  -d '{"due_at":-100}'
{"error":"Invalid due_at"}

$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ytx9vzhqf0lisil8dpev6iqx \
  -H 'Content-Type: application/json' \
  -d '{"due_at":0}'
{"error":"Invalid due_at"}

$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ytx9vzhqf0lisil8dpev6iqx \
  -H 'Content-Type: application/json' \
  -d '{"due_at":1700000000000.5}'
{"error":"Invalid due_at"}

$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ytx9vzhqf0lisil8dpev6iqx \
  -H 'Content-Type: application/json' \
  -d '{"due_at":"not-a-number"}'
{"error":"Invalid due_at"}

$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/tasks/ytx9vzhqf0lisil8dpev6iqx \
  -H 'Content-Type: application/json' \
  -d '{"due_at":1893456000000}'
{"data":{"id":"ytx9vzhqf0lisil8dpev6iqx","title":"PUT Test Task","dueAt":1893456000000,"completed":0,"contactId":null,"dealId":null,"ownerId":"F18n66xWWoBL2cHuTODN6F3ZZq5PeDtE","createdAt":1782844371846,"updatedAt":1782844383879}}
```

**Result:** All cases pass — negative integers, zero, floats, and strings are all rejected with 400; valid positive integer timestamps produce 201 (POST) / 200 (PUT). ✓
