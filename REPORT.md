**Documented limitation (now resolved):** The deals-summary endpoint originally used `updated_at` as a proxy for stage-change time, which was inaccurate for deals edited after their stage changed. This was fixed by adding a `stage_changed_at` column and updating the filtering logic — see the "stage_changed_at Fix" section below for details.

---

## stage_changed_at Fix

**Change:** Added `stage_changed_at` column to the `deals` table, set only on actual stage transitions. Updated both the deals route handler and the reports deals-summary endpoint to use this column instead of `updated_at` for stage-change reporting.

### Files Created
- `api/scripts/backfill-stage-changed-at.ts` — One-time backfill for existing won/lost deals

### Files Modified
- `api/src/db/schema.ts` — Added `stageChangedAt: integer("stage_changed_at")` to deals table
- `api/src/db/migrations/0003_jittery_thunderbolt_ross.sql` — Generated migration (ALTER TABLE ADD COLUMN)
- `api/src/routes/deals.ts` — POST sets `stageChangedAt` on creation with non-default stage; PUT sets `stageChangedAt` only when stage actually changes
- `api/src/routes/reports.ts` — deals-summary now filters by `stage_changed_at` instead of `updated_at`, with `isNotNull` guard

### Backfill

```
$ npx tsx scripts/backfill-stage-changed-at.ts
Found 3 deal(s) to backfill:
  qkq546opfe8lnq0gbh6vy1cu | stage=won | updated_at=1782845179362
  u9qslsw8tlkx4ywiqm481xrr | stage=won | updated_at=1782845179384
  d0ufkxboiuyzldl8ninw19am | stage=lost | updated_at=1782845179408
Backfill complete.
```

Existing won/lost deals had `stage_changed_at = updated_at` as an approximation (best available signal for historical data).

### Verification

**1. Creating a deal with stage "won" sets `stage_changed_at`:**

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/deals \
  -H 'Content-Type: application/json' \
  -d '{"title":"Won at Creation","stage":"won","value":300000}'

{"data":{"id":"sz91d9de3nyjvd6wcwy0ww9i","title":"Won at Creation","stage":"won","value":300000,"stageChangedAt":1782847376086,"createdAt":1782847376086,"updatedAt":1782847376086,...}}
```

`stageChangedAt` = `1782847376086` (matches creation time) ✓

**2. Editing an unrelated field (title) — `updated_at` changes, `stage_changed_at` stays:**

```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/deals/sz91d9de3nyjvd6wcwy0ww9i \
  -H 'Content-Type: application/json' \
  -d '{"title":"Won at Creation - Title Edited"}'

{"data":{"id":"sz91d9de3nyjvd6wcwy0ww9i","title":"Won at Creation - Title Edited","stage":"won","value":300000,"stageChangedAt":1782847376086,"createdAt":1782847376086,"updatedAt":1782847376166,...}}
```

- `stageChangedAt` = `1782847376086` (unchanged) ✓
- `updatedAt` = `1782847376166` (changed from `1782847376086`) ✓

**3. Creating a deal with default "new" stage — `stage_changed_at` is null:**

```
$ curl -s -b /tmp/cookies_u1.txt -X POST http://localhost:3000/deals \
  -H 'Content-Type: application/json' \
  -d '{"title":"Start as New","value":80000}'

{"data":{"id":"fkrhsowm5dvhjwwlyxb4a5le","title":"Start as New","stage":"new","value":80000,"stageChangedAt":null,...}}
```

`stageChangedAt` = `null` ✓

**4. Moving that deal to "won" via PUT — `stage_changed_at` is set:**

```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/deals/fkrhsowm5dvhjwwlyxb4a5le \
  -H 'Content-Type: application/json' \
  -d '{"stage":"won"}'

{"data":{"id":"fkrhsowm5dvhjwwlyxb4a5le","title":"Start as New","stage":"won","value":80000,"stageChangedAt":1782847399525,...}}
```

`stageChangedAt` = `1782847399525` (set to PUT time) ✓

**5. Editing that deal's title again — `stage_changed_at` preserved, `updated_at` changes:**

```
$ curl -s -b /tmp/cookies_u1.txt -X PUT http://localhost:3000/deals/fkrhsowm5dvhjwwlyxb4a5le \
  -H 'Content-Type: application/json' \
  -d '{"title":"Start as New - Title Edited"}'

{"data":{"id":"fkrhsowm5dvhjwwlyxb4a5le","title":"Start as New - Title Edited","stage":"won","value":80000,"stageChangedAt":1782847399525,"updatedAt":1782847399587,...}}
```

- `stageChangedAt` = `1782847399525` (unchanged from when stage changed) ✓
- `updatedAt` = `1782847399587` (changed) ✓

**6. deals-summary correctly reflects `stage_changed_at`-based filtering:**

```
$ curl -s -b /tmp/cookies_u1.txt http://localhost:3000/reports/deals-summary
{"won":{"count":4,"total":630000},"lost":{"count":1,"total":10000},"from":...,"to":...}
```

- won: 4 deals, total = 630000 (200000+50000+300000+80000) ✓
- lost: 1 deal, total = 10000 ✓

### Null guard

The reports query includes `isNotNull(deals.stageChangedAt)` in the WHERE clause. If a won/lost deal somehow has null `stage_changed_at` (should not happen after backfill), it is excluded from date-ranged results rather than crashing or returning incorrect data.

**Result:** All acceptance criteria met. No false attribution of deals to wrong date ranges due to non-stage edits. ✓
