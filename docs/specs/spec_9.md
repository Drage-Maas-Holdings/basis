You are implementing the Reporting Endpoints for the Basis CRM project.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

FEATURE: Reporting Endpoints

OVERVIEW:
Implement read-only endpoints for basic CRM metrics: leads (contacts) added
over a period, deals won and lost over a period, and a count of upcoming
tasks. These are aggregations over existing tables from Spec 4, 5, and 6;
no new tables or write logic are introduced. All routes require a valid
authenticated session using the existing middleware from Spec 3.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory for all commands: api/
- Contacts table (Spec 4): has created_at
- Deals table (Spec 5): has stage (new, qualified, won, lost) and
  created_at, updated_at
- Tasks table (Spec 6): has due_at (nullable), completed (0/1)
- Auth middleware already exists from Spec 3 (api/src/auth/middleware.ts);
  reuse it directly, do not write new auth logic
- Visibility matches the rest of the API: any authenticated user can read
  all reporting data regardless of ownership; these are aggregate company
  metrics, not personal data

NEW FILES:
```
api/
  src/
    routes/
      reports.ts       # All reporting/metrics routes
```

ENDPOINTS:
- GET /reports/leads-added       Count of contacts created within a date range
- GET /reports/deals-summary     Count and value of deals won/lost within a date range
- GET /reports/upcoming-tasks    Count of incomplete tasks due in the future

DATE RANGE PARAMETERS:
- All date-range endpoints accept `from` and `to` query parameters as Unix
  ms timestamps
- If `from` is omitted, default to 30 days before the current server time
- If `to` is omitted, default to the current server time
- `from` must not be after `to`; if it is, return 400
- A date range is inclusive of both boundaries

ACCEPTANCE CRITERIA:

GET /reports/leads-added:
1. Protected by auth middleware; 401 without a valid session
2. Returns a count of contacts whose created_at falls within the
   [from, to] range (inclusive)
3. With no contacts in range, returns count: 0, not an error
4. Invalid from/to (non-numeric, or from after to) returns 400

GET /reports/deals-summary:
5. Protected by auth middleware; 401 without a valid session
6. Returns counts and total value (sum of `value`, nulls treated as 0,
   in minor currency units) for deals with stage "won" and separately for
   stage "lost", where the deal's updated_at falls within the [from, to]
   range (use updated_at, not created_at, since a stage change to won/lost
   is what updated_at reflects; do not use created_at for this endpoint)
7. Response includes both won and lost as separate objects, each with
   count and total value, even if one or both have zero matches in range
8. Invalid from/to (non-numeric, or from after to) returns 400

GET /reports/upcoming-tasks:
9. Protected by auth middleware; 401 without a valid session
10. Returns a count of tasks where completed is false (0) and due_at is
    set and due_at is in the future relative to current server time
11. Tasks with due_at in the past are not counted here (those are
    "overdue," already covered by Spec 6's overdue filter on GET /tasks,
    not duplicated in this endpoint)
12. Tasks with no due_at (null) are not counted as upcoming
13. This endpoint does not accept from/to parameters; "upcoming" is always
    relative to the current server time with no fixed window, returning a
    simple total count
14. With zero qualifying tasks, returns count: 0, not an error

GENERAL:
15. npm run build completes with zero TypeScript errors

RESPONSE SHAPES:

GET /reports/leads-added:
```json
{ "count": 14, "from": 1782000000000, "to": 1782604800000 }
```

GET /reports/deals-summary:
```json
{
  "won": { "count": 3, "total": 250000 },
  "lost": { "count": 1, "total": 10000 },
  "from": 1782000000000,
  "to": 1782604800000
}
```

GET /reports/upcoming-tasks:
```json
{ "count": 5 }
```

CONSTRAINTS:
- Reuse the existing auth middleware from Spec 3 unmodified
- These are all read-only endpoints; no POST, PUT, or DELETE logic
- Validate from/to query parameters before any database call
- The "current server time" used for upcoming-tasks and as the default
  value for `to` must be computed at request time, not cached or hardcoded
- Do not introduce pagination on these endpoints; they return aggregate
  numbers, not lists of records

OUT OF SCOPE:
- Any UI, charting, or visualization
- Date ranges other than from/to query parameters (no relative shortcuts
  like "?period=this_month" in this spec)
- Per-user breakdowns (e.g. "leads added by owner X") — these are
  company-wide aggregates only in this spec
- Exporting report data (CSV, PDF, etc.)
- Real-time updates or webhooks on metric changes

EDGE CASES:
- A from/to range entirely in the future (no data could possibly exist
  yet) returns count: 0, not an error
- A deal that moves from "qualified" to "won" and then is edited again
  (e.g. value corrected) without changing stage still has its updated_at
  refreshed; this means deals-summary could undercount or overcount stage
  transitions if a deal is edited after winning without a stage change.
  This is a known limitation of using updated_at as a proxy for "when did
  this deal close" — do not attempt to solve this with a separate
  stage-history table in this spec; flag it in your report as a documented
  limitation for a future spec to address if it becomes a real problem
- from = to (single point in time) is valid and should not error; it
  simply means the inclusive range is one instant, very likely returning
  zero results in practice, which is correct behavior, not a bug

REPORTING REQUIREMENT:
Before finishing, write a REPORT.md file in the project root documenting
your work, following the same standard established in prior specs:
- A summary of files created and modified
- Build and lint results, both shown with actual output
- For every acceptance criterion above, the actual raw curl command and
  raw response output used to verify it — not a summary table of
  checkmarks without evidence
- Explicit verification of the zero-results case for each endpoint, with
  raw output (not inferred from code structure, actually run against data
  that produces zero matches)
- Explicit verification of the from > to validation (400 case) for both
  date-range endpoints
- Explicit restatement of the updated_at limitation described in EDGE
  CASES, confirming it was understood and not silently worked around
- Any deviation from this spec, however small, reported explicitly rather
  than silently resolved
- Do not claim anything is "verified" based on type-checking, build
  output, or code review alone; only runtime test execution with shown
  output counts as verification

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.