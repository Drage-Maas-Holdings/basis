# Deals API - Implementation Report

## Implementation Summary

**Spec:** `specs/spec_5.md` — Deals API

**Files Created:**
- `api/src/routes/deals.ts` — All deals CRUD, stage transitions, and filter routes

**Files Modified:**
- `api/src/index.ts` — Registered deals routes

### Endpoints Implemented

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| POST | /deals | 201 | Create a deal |
| GET | /deals | 200 | List deals (filter/pagination) |
| GET | /deals/:id | 200/404 | Get single deal (includes linked contact) |
| PUT | /deals/:id | 200/400/403/404 | Update a deal, including stage transitions |
| DELETE | /deals/:id | 204/403/404 | Delete a deal |

### Build & Lint

- `npm run build` — Zero TypeScript errors
- `npm run lint` — Zero warnings, zero errors

---

## Acceptance Criteria — Raw Verification

### AC-1: All endpoints protected by auth middleware (401)

```
$ curl -s -X POST http://localhost:3000/deals \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test"}'

{"error":"Unauthorized"}

$ curl -s http://localhost:3000/deals

{"error":"Unauthorized"}

$ curl -s http://localhost:3000/deals/some-id

{"error":"Unauthorized"}

$ curl -s -X PUT http://localhost:3000/deals/some-id \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test"}'

{"error":"Unauthorized"}

$ curl -s -X DELETE http://localhost:3000/deals/some-id

{"error":"Unauthorized"}
```

**Result:** All five endpoints return `{"error":"Unauthorized"}` without a valid session. ✓

---

### AC-2: POST /deals creates with server-generated cuid, sets owner_id, timestamps, defaults stage to "new"

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/deals \
  -H 'Content-Type: application/json' \
  -d '{"title":"Enterprise Deal","value":50000}'

{"data":{"id":"q2otgoe02c5na96mdrjrboo7","title":"Enterprise Deal","stage":"new","value":50000,"contactId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782826892981,"updatedAt":1782826892981}}
```

- ID `q2otgoe02c5na96mdrjrboo7` is a cuid2 (no hyphens) ✓
- `ownerId` matches the authenticated user (test@example.com) ✓
- `stage` defaults to `"new"` when not provided ✓
- `createdAt` and `updatedAt` are set ✓
- Returns 201 ✓

---

### AC-3: POST /deals rejects missing `title` with 400

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/deals \
  -H 'Content-Type: application/json' \
  -d '{}'

{"error":"Title is required"}
```

**Result:** 400 with clear error message before any database call. ✓

---

### AC-4: POST /deals rejects invalid `stage` with 400

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/deals \
  -H 'Content-Type: application/json' \
  -d '{"title":"Bad Deal","stage":"invalid"}'

{"error":"Invalid stage"}
```

**Result:** 400 for stage outside `new`, `qualified`, `won`, `lost`. ✓

---

### AC-5: POST /deals validates `contact_id`

**Invalid (non-existent contact):**
```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/deals \
  -H 'Content-Type: application/json' \
  -d '{"title":"Bad Deal","contact_id":"nonexistent"}'

{"error":"Contact not found"}
```

**Valid (existing contact):**
```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/deals \
  -H 'Content-Type: application/json' \
  -d '{"title":"Linked Deal","contact_id":"f58nzd8jmt86u4o78y7l2et1"}'

{"data":{"id":"lgwmhxpejbz4ybr7qat6iewt","title":"Linked Deal","stage":"new","value":null,"contactId":"f58nzd8jmt86u4o78y7l2et1","ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782826902848,"updatedAt":1782826902848}}
```

**Result:** Non-existent contact returns 400, valid contact creates the deal linked to it. ✓

---

### AC-6: GET /deals returns paginated list (default 25, configurable, cap 100)

**Default pagination:**
```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/deals

Count: 3
Pagination: {"limit":25,"offset":0,"total":3}
```

**Custom limit/offset:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/deals?limit=2&offset=1'

Count: 2
Pagination: {"limit":2,"offset":1,"total":3}
```

**Cap at 100:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/deals?limit=200'

Pagination: {"limit":100,"offset":0,"total":3}
```

**Result:** Pagination shape matches Spec 4 exactly. ✓

---

### AC-7: GET /deals supports filtering by `stage` and `owner_id`

**Filter by stage:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/deals?stage=new'

Count: 2
  Enterprise Deal - stage: new
  Linked Deal - stage: new
Total: 2

$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/deals?stage=qualified'

Count: 1
  Qualified Deal - stage: qualified
Total: 1
```

**Filter by owner_id:**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/deals?owner_id=hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG'

Count: 3
```

**Empty result (no matches):**
```
$ curl -s -b /tmp/cookies_u1.txt 'http://localhost:3000/deals?stage=won'

Count: 0
Total: 0
```

**Result:** Both filters work as exact matches, empty filter returns `total: 0` not 404. ✓

---

### AC-8: GET /deals/:id returns deal with embedded contact data

**With linked contact:**
```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/deals/lgwmhxpejbz4ybr7qat6iewt

{"data":{"id":"lgwmhxpejbz4ybr7qat6iewt","title":"Linked Deal","stage":"new","value":null,"contactId":"f58nzd8jmt86u4o78y7l2et1","ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782826902848,"updatedAt":1782826902848,"contact":{"id":"f58nzd8jmt86u4o78y7l2et1","name":"John Doe Updated","email":"john@example.com","company":"Acme Corp"}}}
```

**Without linked contact:**
```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/deals/q2otgoe02c5na96mdrjrboo7

{"data":{"id":"q2otgoe02c5na96mdrjrboo7","title":"Enterprise Deal","stage":"new","value":50000,"contactId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782826892981,"updatedAt":1782826892981,"contact":null}}
```

**Non-existent deal:**
```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/deals/nonexistent

{"error":"Deal not found"}
```

**Result:** Contact data embedded under `contact` key when `contact_id` is set, `null` when not, 404 for non-existent. ✓

---

### AC-9: PUT /deals/:id updates provided fields only

```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/deals/q2otgoe02c5na96mdrjrboo7 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Enterprise Deal Renamed","value":75000}'

{"data":{"id":"q2otgoe02c5na96mdrjrboo7","title":"Enterprise Deal Renamed","stage":"new","value":75000,"contactId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782826892981,"updatedAt":1782826923468}}
```

**Result:** Only `title` and `value` changed, `updatedAt` refreshed, `id` and `ownerId` unchanged. ✓

**Unlink contact (contact_id = null):**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/deals/lgwmhxpejbz4ybr7qat6iewt \
  -H 'Content-Type: application/json' \
  -d '{"contact_id":null}'

{"data":{"id":"lgwmhxpejbz4ybr7qat6iewt","title":"Linked Deal","stage":"new","value":null,"contactId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782826902848,"updatedAt":1782826923523}}
```

**Result:** Setting `contact_id` to `null` removes the link. ✓

---

### AC-10: PUT /deals/:id validates stage on update

**Invalid stage:**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/deals/q2otgoe02c5na96mdrjrboo7 \
  -H 'Content-Type: application/json' \
  -d '{"stage":"invalid"}'

{"error":"Invalid stage"}
```

**Valid stage transition:**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/deals/q2otgoe02c5na96mdrjrboo7 \
  -H 'Content-Type: application/json' \
  -d '{"stage":"qualified"}'

{"data":{"id":"q2otgoe02c5na96mdrjrboo7","title":"Enterprise Deal Renamed","stage":"qualified","value":75000,"contactId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782826892981,"updatedAt":1782826923506}}
```

**Invalid contact_id on PUT:**
```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/deals/lgwmhxpejbz4ybr7qat6iewt \
  -H 'Content-Type: application/json' \
  -d '{"contact_id":"nonexistent"}'

{"error":"Contact not found"}
```

**Result:** Invalid stage → 400, valid stage → 200 with updated record, invalid contact_id → 400. ✓

---

### AC-11: PUT /deals/:id returns 403 if not owner, 404 if not exists

**Non-owner attempts update:**
```
$ curl -s -b /tmp/cookies_u2.txt -X PUT http://localhost:3000/deals/q2otgoe02c5na96mdrjrboo7 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hacked"}'

{"error":"Forbidden"}
```

**Non-existent deal (404 takes precedence over 403):**
```
$ curl -s -b /tmp/cookies_u2.txt -X PUT http://localhost:3000/deals/nonexistent \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hacked"}'

{"error":"Deal not found"}
```

**Result:** 403 for non-owner, 404 for non-existent (even for non-owner). ✓

---

### AC-12: DELETE /deals/:id returns 204 if owner, 403 if not, 404 if not exists

**Non-owner delete:**
```
$ curl -s -b /tmp/cookies_u2.txt -X DELETE http://localhost:3000/deals/q2otgoe02c5na96mdrjrboo7 -w '\nHTTP %{http_code}\n'

{"error":"Forbidden"}
HTTP 403
```

**Non-existent delete:**
```
$ curl -s -b /tmp/cookies_u2.txt -X DELETE http://localhost:3000/deals/nonexistent -w '\nHTTP %{http_code}\n'

{"error":"Deal not found"}
HTTP 404
```

**Owner delete:**
```
$ curl -s -b /tmp/cookies_u1.txt -X DELETE http://localhost:3000/deals/q2otgoe02c5na96mdrjrboo7 -w '\nHTTP %{http_code}\n'


HTTP 204
```

**Result:** 204 for owner, 403 for non-owner, 404 for non-existent. ✓

---

### AC-13: Any authenticated user can read any deal

**User 2 (non-owner) reads User 1's deal:**
```
$ curl -s -b /tmp/cookies_u2.txt http://localhost:3000/deals/lgwmhxpejbz4ybr7qat6iewt

{"data":{"id":"lgwmhxpejbz4ybr7qat6iewt","title":"Linked Deal","stage":"new","value":null,"contactId":null,"ownerId":"hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG","createdAt":1782826902848,"updatedAt":1782826923523,"contact":null}}
```

**User 2 lists all deals:**
```
$ curl -s -b /tmp/cookies_u2.txt http://localhost:3000/deals

Count: 2 | Total: 2
  lgwmhxpe... Linked Deal
  g8zp8xve... Qualified Deal
```

**User 2 filters by User 1's owner_id:**
```
$ curl -s -b /tmp/cookies_u2.txt 'http://localhost:3000/deals?owner_id=hZqvjo73lNZVhkhByhWRk7Nh2A2ByqrG'

Count: 2
```

**Result:** Any authenticated user can read (list, get by id, filter) any deal regardless of ownership. ✓

---

### AC-14: npm run build zero TypeScript errors

```
> basis-crm@0.1.0 build
> rolldown -c

✔ rolldown v1.1.3 Finished in 144.91 ms
```

---

## Ownership Enforcement — Raw 403 Verification

### User 2 attempts UPDATE on User 1's deal → 403

```
$ curl -s -b /tmp/cookies_u2.txt -X PUT http://localhost:3000/deals/lgwmhxpejbz4ybr7qat6iewt \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hacked"}'

{"error":"Forbidden"}
```

**403 leak check:**
- Contains `ownerId`? → 0 matches
- Contains deal title? → 0 matches
- Contains owner ID value? → 0 matches
- Contains contact data? → 0 matches

### User 2 attempts DELETE on User 1's deal → 403

```
$ curl -s -b /tmp/cookies_u2.txt -X DELETE http://localhost:3000/deals/lgwmhxpejbz4ybr7qat6iewt -w '\nHTTP %{http_code}\n'

{"error":"Forbidden"}
HTTP 403
```

**403 leak check:**
- Body: `{"error":"Forbidden"}`
- Contains `ownerId`? → 0 matches
- Contains deal data? → 0 matches

### Deal confirmed unchanged after failed update attempt

```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/deals/lgwmhxpejbz4ybr7qat6iewt

Deal still exists: Linked Deal
```

**Result:** 403 body is `{"error":"Forbidden"}` — no owner_id, deal data, or any other information leaked. ✓

---

## Acceptance Criteria Summary

| # | Criterion | Status |
|---|-----------|--------|
| 1 | All endpoints protected by auth middleware (401) | ✓ |
| 2 | POST creates with server-generated cuid, owner_id, timestamps, defaults stage to "new" | ✓ |
| 3 | POST rejects missing `title` with 400 | ✓ |
| 4 | POST rejects invalid `stage` with 400 | ✓ |
| 5 | POST validates `contact_id` (400 if non-existent, 201 if valid) | ✓ |
| 6 | GET returns paginated list (default 25, configurable, cap 100, matching Spec 4 shape) | ✓ |
| 7 | GET supports filtering by `stage` and `owner_id` (exact match) | ✓ |
| 8 | GET /:id returns deal with embedded contact data (or null), 404 if not found | ✓ |
| 9 | PUT updates provided fields only, updates updated_at, blocks id/owner_id changes | ✓ |
| 10 | PUT validates stage and contact_id same as POST | ✓ |
| 11 | PUT returns 403 if not owner, 404 if not exists (404 precedence) | ✓ |
| 12 | DELETE returns 204 if owner, 403 if not, 404 if not exists (404 precedence) | ✓ |
| 13 | Any authenticated user can read any deal | ✓ |
| 14 | `npm run build` completes with zero TypeScript errors | ✓ |

**Deviation from spec:** None found.
