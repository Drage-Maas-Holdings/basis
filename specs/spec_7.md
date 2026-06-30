You are implementing the Interaction Logs API for the Basis CRM project.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

FEATURE: Interaction Logs API

OVERVIEW:
Implement create and read endpoints for the interaction_logs table. This is
an append-only log of emails, calls, meetings, and notes tied to a contact
and/or a deal. There is no update or delete endpoint in this spec; entries
are immutable once created. All routes require a valid authenticated
session using the existing middleware from Spec 3.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory for all commands: api/
- interaction_logs table already exists from Spec 2: id, type, body,
  contact_id, deal_id, logged_by, created_at (no updated_at column, by
  design — see Spec 2's design decisions)
- type is constrained at the schema level to: email, call, meeting, note
- contact_id and deal_id are both nullable; a log entry may link to a
  contact, a deal, or both (Spec 2 requires at least conceptual linkage to
  one or the other, but the schema itself does not enforce this at the
  database level — this spec enforces it at the application level, see
  ACCEPTANCE CRITERIA below)
- Auth middleware already exists from Spec 3 (api/src/auth/middleware.ts);
  reuse it directly, do not write new auth logic
- Contacts (Spec 4), Deals (Spec 5), and Tasks (Spec 6) routes already
  exist and establish the structure, error shapes, and validation patterns
  this spec must follow for consistency
- cuid2 is the required id format; use @paralleldrive/cuid2's createId(),
  already installed

NEW FILES:
```
api/
  src/
    routes/
      interaction-logs.ts   # Create and list/read routes for logs
```

ENDPOINTS:
- POST   /interaction-logs           Create a log entry
- GET    /interaction-logs           List log entries, with filter/pagination
- GET    /interaction-logs/:id       Get a single log entry

No PUT or DELETE endpoint exists for this resource. This is intentional and
not an oversight.

ACCEPTANCE CRITERIA:
1. All three endpoints are protected by the existing auth middleware; a
   request with no valid session returns 401 before touching the database
2. POST /interaction-logs creates a log entry with a server-generated cuid,
   sets logged_by to the authenticated user's id (not from the request
   body), and sets created_at; returns 201 with the created record
3. POST /interaction-logs rejects a request missing the required `type`
   field with 400
4. POST /interaction-logs rejects an invalid `type` value (anything outside
   email, call, meeting, note) with 400
5. POST /interaction-logs rejects a request missing the required `body`
   field with 400
6. POST /interaction-logs requires at least one of `contact_id` or
   `deal_id` to be provided; a request with both absent or null is
   rejected with 400
7. POST /interaction-logs validates `contact_id` if provided; it must
   reference an existing contact or the request is rejected with 400
8. POST /interaction-logs validates `deal_id` if provided; it must
   reference an existing deal or the request is rejected with 400
9. GET /interaction-logs returns a paginated list, default page size 25,
   configurable via `limit` with a hard cap of 100, matching the pagination
   shape from Spec 4, 5, and 6
10. GET /interaction-logs supports filtering by `contact_id`, `deal_id`,
    `type`, and `logged_by`, all exact match, combinable
11. GET /interaction-logs returns entries ordered by created_at descending
    (most recent first) by default
12. GET /interaction-logs/:id returns the entry, or 404 if it does not exist
13. There is no PUT or DELETE route; a request to either method on
    /interaction-logs/:id returns 404 or 405 (whichever is the natural
    result of the route simply not being registered — do not add explicit
    handlers that return a custom error for these methods)
14. Any authenticated user can read (list, filter, get by id) any log entry
    regardless of who logged it; there is no ownership-based restriction on
    reads, consistent with the rest of the API
15. npm run build completes with zero TypeScript errors

PAGINATION RESPONSE SHAPE:
Match Spec 4, 5, and 6 exactly:
```json
{
  "data": [ /* log entry records */ ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 8
  }
}
```

CONSTRAINTS:
- Reuse the existing auth middleware from Spec 3 unmodified
- Follow the same route file structure, error response shapes, and
  validation patterns established in contacts.ts, deals.ts, and tasks.ts
  for consistency across the codebase
- cuid generation happens in the application layer using createId()
- The authenticated user's id (from the session, via the auth middleware's
  context) is the only source of truth for logged_by; never trust a
  logged_by value supplied in the request body
- Validate request bodies before any database call; do not let malformed
  input or invalid foreign keys reach Drizzle and surface as a raw
  database error
- due_at-style numeric validation does not apply here; there is no due_at
  on this table
- Do not implement any update or delete logic for this resource under any
  circumstance, even if it seems convenient; logs are immutable by design

OUT OF SCOPE:
- Any update or delete capability for log entries
- Editing or redacting log entries after creation
- Reporting/metrics endpoints
- Any UI

EDGE CASES:
- A log entry with both contact_id and deal_id set is valid (e.g. a call
  logged about a specific deal tied to a specific contact)
- A log entry with neither contact_id nor deal_id is invalid and rejected
  with 400, per AC-6 — this differs from tasks, where neither link is
  required; interaction logs must always be tied to something
- A filter combination that matches no entries returns an empty data array
  and pagination.total of 0, not a 404
- An `offset` beyond the total record count returns an empty data array,
  not an error

REPORTING REQUIREMENT:
Before finishing, write a REPORT.md file in the project root documenting
your work, following the same standard established in prior specs:
- A summary of files created and modified
- The full list of endpoints implemented with their methods and status codes
- Build and lint results, both shown with actual output
- For every acceptance criterion above, the actual raw curl command and raw
  response output used to verify it — not a summary table of checkmarks
  without evidence
- Explicit verification that no PUT or DELETE route exists for this
  resource (show the actual response when those methods are attempted)
- Explicit verification of AC-6 (the contact_id/deal_id requirement),
  including the case where a log entry has both set
- Any deviation from this spec, however small, reported explicitly rather
  than silently resolved
- Do not claim anything is "verified" based on type-checking, build output,
  or code review alone; only runtime test execution with shown output
  counts as verification

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.