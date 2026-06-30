# Contacts API - Implementation Report

## Implementation Summary

**Spec:** `specs/spec_4.md` — Contacts API
**Files Created:** `api/src/routes/contacts.ts`
**Files Modified:** `api/src/index.ts`, `api/src/routes/contacts.ts`, `api/package.json`
**Files Added:** `api/scripts/migrate-contact-ids.mjs`

### Endpoints Implemented

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| POST | /contacts | 201 | Create a contact |
| GET | /contacts | 200 | List contacts (search/filter/pagination) |
| GET | /contacts/:id | 200/404 | Get single contact |
| PUT | /contacts/:id | 200/403/404 | Update a contact |
| DELETE | /contacts/:id | 204/403/404 | Delete a contact |

### Build & Lint

- `npm run build` — Zero TypeScript errors
- `npm run lint` — Zero warnings, zero errors

---

## Verification Outcome

### Deviation Found: UUID v4 used instead of cuid

**Spec requirement (Spec 2 + Spec 4):** Contact IDs must be cuids generated in the application layer.

**Implementation reality:** `api/src/routes/contacts.ts:22` used `crypto.randomUUID()` producing UUID v4 strings.

**Existing data (migrated):**

| Old UUID (v4) | New cuid2 | Name |
|---------------|-----------|------|
| `88063e31-4922-487f-9116-e22a082fac8e` | `f58nzd8jmt86u4o78y7l2et1` | John Doe Updated |
| `a7abb786-5c48-44e1-be1d-8b657c46f1f8` | `y01vo0xckqv4j0osxvu7389m` | Bob Wilson |

**Fix applied:**
1. Installed `@paralleldrive/cuid2`
2. Replaced `crypto.randomUUID()` → `createId()` in `contacts.ts:23`
3. Ran migration script to re-generate existing UUIDs as cuid2 (no foreign key references existed)
4. Verified new POST creates cuid2 IDs (e.g. `tsm4zi0kiyvsuz41b1ju5i2l`)

---

## Test Results

### Authentication (401)

```
GET  /contacts          → {"error": "Unauthorized"}  ✓
POST /contacts          → {"error": "Unauthorized"}  ✓
```

### POST /contacts — Create

| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Create contact | `{name, email, phone, company, notes}` | 201 + record | 201 + record | ✓ |
| Create contact (minimal) | `{name}` | 201 + record | 201 + record | ✓ |
| Missing name | `{email}` | 400 | `{"error": "Name is required"}` | ✓ |

**Created records (after migration to cuid2):**
- `f58nzd8jmt86u4o78y7l2et1` — John Doe Updated (Acme Corp)
- `y01vo0xckqv4j0osxvu7389m` — Bob Wilson (Other Inc)

### GET /contacts — List & Search

| Test | Query | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| List all | — | 2 contacts, total: 2 | ✓ | ✓ |
| Search by name | `?search=John` | 1 contact | ✓ | ✓ |
| Search by email | `?search=john@` | 1 contact | ✓ | ✓ |
| Search by company | `?search=Acme` | 1 contact | ✓ | ✓ |
| Filter by company | `?company=Acme Corp` | 1 contact (exact) | ✓ | ✓ |
| No results | `?search=nonexistent` | empty array, total: 0 | ✓ | ✓ |

### GET /contacts — Pagination

| Test | Params | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| Default | — | limit: 25, offset: 0 | ✓ | ✓ |
| Page 1 | `?limit=2&offset=0` | 2 contacts, total: 2 | ✓ | ✓ |
| Page 2 | `?limit=2&offset=2` | 0 contacts, total: 2 | ✓ | ✓ |
| Cap at 100 | `?limit=200` | limit: 100 | ✓ | ✓ |

### GET /contacts/:id — Get Single

| Test | ID | Expected | Actual | Status |
|------|----|----------|--------|--------|
| Found | `f58nzd8jmt86u4o78y7l2et1` | 200 + record | ✓ | ✓ |
| Not found | `nonexistent-id` | 404 `{"error": "Contact not found"}` | ✓ | ✓ |

### PUT /contacts/:id — Update

| Test | Body | Expected | Actual | Status |
|------|------|----------|--------|--------|
| Update own | `{name, notes}` | 200 + updated record, new timestamp | ✓ | ✓ |
| Not found | `{name}` | 404 `{"error": "Contact not found"}` | ✓ | ✓ |
| Not owner (403) | `{name}` | 403 `{"error": "Forbidden"}` | ✓ | ✓ |

**Verified:** `ownerId` and `id` not modified by PUT.

### DELETE /contacts/:id — Delete

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Not owner | 403 | ✓ | ✓ |
| Not found | 404 `{"error": "Contact not found"}` | ✓ | ✓ |
| Delete own | 204 (no body) | ✓ | ✓ |

### Ownership Enforcement — Raw Verification

**Users:**
- **User 1** (`test@example.com`, id: `hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG`) — owns John Doe, Bob Wilson
- **User 2** (`other@example.com`, id: `enHIGq83vhTpF4BeKd8y1A3rV3V4cFrj`) — owns nothing

**Test 1 — User 2 (non-owner) attempts UPDATE on User 1's contact → 403**
```
$ curl -s -b /tmp/cookies_u2.txt -X PUT http://localhost:3000/contacts/f58nzd8jmt86u4o78y7l2et1 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Hacked Name"}'

{"error":"Forbidden"}
```

**Test 2 — User 2 (non-owner) attempts DELETE on User 1's contact → 403**
```
$ curl -s -b /tmp/cookies_u2.txt -X DELETE http://localhost:3000/contacts/f58nzd8jmt86u4o78y7l2et1

{"error":"Forbidden"}
```

**Test 3 — User 2 (non-owner) attempts READ User 1's contact → 200**
```
$ curl -s -b /tmp/cookies_u2.txt http://localhost:3000/contacts/f58nzd8jmt86u4o78y7l2et1

{"data":{"id":"f58nzd8jmt86u4o78y7l2et1","name":"John Doe Updated","email":"john@example.com","phone":"555-0101","company":"Acme Corp","notes":"Updated notes","ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782823492684,"updatedAt":1782823531693}}
```

**Test 4 — 403 response body does NOT leak owner info**

403 body: `{"error":"Forbidden"}`
- Contains `ownerId`? → 0 matches
- Contains `owner_id`? → 0 matches
- Contains user id? → 0 matches
- Contains contact data? → 0 matches

**Post-verification:** Contact was confirmed unchanged after the failed update attempt.

---

## Acceptance Criteria Checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | All endpoints protected by auth middleware (401) | ✓ |
| 2 | POST creates with server-generated id, sets owner_id + timestamps, returns 201 | ✓ |
| 3 | POST rejects missing `name` with 400 | ✓ |
| 4 | GET returns paginated list (default 25, configurable, cap 100) | ✓ |
| 5 | GET supports `search` (case-insensitive partial on name, email, company) | ✓ |
| 6 | GET supports `company` filter (exact match) | ✓ |
| 7 | GET /:id returns contact or 404 | ✓ |
| 8 | PUT updates provided fields, updates updated_at, blocks owner_id/id changes | ✓ |
| 9 | PUT returns 403 if not owner, 404 if not exists (404 precedence) | ✓ |
| 10 | DELETE returns 204 if owner, 403 if not, 404 if not exists | ✓ |
| 11 | Any authenticated user can read any contact | ✓ |
| 12 | `npm run build` completes with zero TypeScript errors | ✓ |
| 13 | Contact IDs are cuids (Spec 2 requirement, fixed during verification) | ✓ |
| 14 | 403 response body does not leak owner information | ✓ |
