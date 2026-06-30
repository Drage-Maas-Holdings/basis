You are fixing a known data-accuracy limitation in the Deals API and Deals
Summary reporting endpoint. This is a small, targeted schema and logic
change, not a rewrite, and not the full stage-history table some future
spec may eventually want.

PROBLEM:
GET /reports/deals-summary currently filters won/lost deals by `updated_at`,
which refreshes on ANY field change, not just a stage change. A deal edited
after being marked "won" (e.g. correcting its value) gets misattributed to
the wrong date range, since updated_at no longer reflects when the stage
actually changed.

FIX REQUIRED:

1. SCHEMA: Add a new nullable column `stage_changed_at` (INTEGER, Unix ms)
   to the deals table. Generate and apply a migration for this change.
   Do not touch updated_at's existing behavior, it still updates on every
   field change as before.

2. WRITE LOGIC: In the deals route (api/src/routes/deals.ts), whenever a
   PUT request changes the `stage` field to a different value than it
   currently is, set `stage_changed_at` to the current server time in the
   same update. If `stage` is not included in the PUT body, or is included
   but unchanged from the current value, do not touch stage_changed_at.
   On POST (deal creation), set stage_changed_at to the creation time if a
   non-default stage is provided, or leave it null if the deal is created
   with the default "new" stage (since "new" is not really a transition).

3. BACKFILL: Existing deals in the database have no stage_changed_at value.
   Write a one-time backfill script that sets stage_changed_at equal to
   updated_at for any existing deal where stage is "won" or "lost" and
   stage_changed_at is null. This is an approximation for historical data
   only, acceptable since it's the best available signal for existing
   records, document this assumption in the script. Deals with a "new" or
   "qualified" stage do not need a value (they have not transitioned to a
   terminal state).

4. REPORTING LOGIC: Update GET /reports/deals-summary
   (api/src/routes/reports.ts) to filter by `stage_changed_at` instead of
   `updated_at` for both won and lost deal queries. If a deal has stage
   "won" or "lost" but stage_changed_at is somehow still null (should not
   happen after backfill, but guard against it), exclude it from
   date-ranged results rather than crashing or silently including it with
   a wrong date — and report if you encounter this case during testing.

ACCEPTANCE CRITERIA:
- stage_changed_at column exists and migration applies cleanly
- Existing won/lost deals have a backfilled stage_changed_at value
- A deal that changes stage gets stage_changed_at set to the current time
- A deal that is edited WITHOUT changing stage does NOT have
  stage_changed_at modified, even though updated_at still changes
- GET /reports/deals-summary now filters by stage_changed_at, verified by:
  creating a deal, marking it "won", then editing an unrelated field
  (e.g. title) a day "later" in test data if your environment allows
  simulating time, or at minimum editing it immediately after and
  confirming stage_changed_at is unchanged while updated_at is
- npm run build completes with zero TypeScript errors
- No other behavior changes to deals.ts or reports.ts beyond what is
  described here

VERIFICATION:
Show raw curl commands and raw responses proving:
1. A deal moved to "won" has stage_changed_at set
2. The same deal, later edited on an unrelated field (title), has
   updated_at change but stage_changed_at remain the same
3. deals-summary correctly reflects stage_changed_at-based filtering, not
   updated_at-based filtering, for at least one case where they would
   produce different results
Append these results to REPORT.md under a new "stage_changed_at Fix"
section.

SECOND DELIVERABLE — improvements.md:

After the fix above is complete and verified, create a file called
improvements.md in the project root (if it does not already exist) and add
an entry documenting the following, in your own words but capturing this
substance:

- Reporting is intended to become a cornerstone feature of this project,
  but the exact reporting requirements are not yet fully defined as of this
  point in development
- The original deals-summary implementation used updated_at as a proxy for
  "when did this deal close," which was inaccurate for any deal edited
  after its stage changed; this was identified and fixed by adding a
  dedicated stage_changed_at column, set only on actual stage transitions
- This stage_changed_at column is a lightweight, single-timestamp solution,
  not a full stage-history table; it captures only the most recent stage
  transition, not a complete audit trail of every stage change a deal has
  gone through over its lifetime
- A full stage-history table (tracking every transition with timestamps,
  not just the latest one) is a candidate future improvement if reporting
  needs grow to require historical trend analysis (e.g. "how long do deals
  typically stay in qualified before moving to won")
- This file (improvements.md) is intended to track known limitations,
  deferred decisions, and candidate future work across the project, not
  just this one item; future specs or fixes that introduce similar
  documented tradeoffs should be added here going forward rather than
  left only in spec files or chat history

Do not begin until you have confirmed your understanding of both
deliverables.