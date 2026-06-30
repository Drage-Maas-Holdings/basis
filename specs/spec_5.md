You are implementing the Deals API for the Basis CRM project.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

FEATURE: Deals API

OVERVIEW:
Implement CRUD endpoints for the deals table, including stage transitions,
owner assignment, and linking to contacts. All routes require a valid
authenticated session using the existing middleware from Spec 3. Visibility
and ownership rules match Spec 4's contacts model: any authenticated user
can read any deal (single-team model, no multi-tenancy); only the deal's
owner may update or delete it.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory for all commands: api/
- Deals table already exists from Spec 2: id, title, stage, value,
  contact_id, owner_id, created_at, updated_at
- stage is constrained at the schema level to: new, qualified, won, lost
- value is nullable, stored as INTEGER in minor currency units (cents)
- Auth middleware already exists from Spec 3 (api/src/auth/middleware.ts);
  reuse it directly, do not write new auth logic
- Contacts route and ownership pattern already exist from Spec 4
  (api/src/routes/contacts.ts); follow the same structure and conventions
  for consistency, including id generation, error shapes, and the 404/403
  precedence rule
- cuid2 is the required id format, per the Spec 4 migration; use
  @paralleldrive/cuid2's createId(), already installed

NEW FILES:
```
api/
  src/
    routes/
      deals.ts       # All deals CRUD, stage transitions, and filter routes
```

ENDPOINTS:
- POST   /deals          Create a deal
- GET    /deals          List deals, with filter/pagination
- GET    /deals/:id      Get a single deal (includes linked contact data)
- PUT    /deals/:id      Update a deal, including stage transitions
- DELETE /deals/:id      Delete a deal

ACCEPTANCE CRITERIA:
1. All five endpoints are protected by the existing auth middleware; a
   request with no valid session returns 401 before touching the database
2. POST /deals creates a deal with a server-generated cuid, sets owner_id to
   the authenticated user's id (not from the request body), sets
   created_at/updated_at, and defaults stage to "new" if not provided;
   returns 201 with the created record
3. POST /deals rejects a request missing the required `title` field with
   400 before reaching the database
4. POST /deals rejects an invalid `stage` value (anything outside new,
   qualified, won, lost) with 400
5. POST /deals accepts an optional `contact_id`; if provided, it must
   reference an existing contact or the request is rejected with 400
   (not a foreign key error surfaced raw from the database)
6. GET /deals returns a paginated list of deals; default page size is 25,
   configurable via `limit` with a hard cap of 100, matching Spec 4's
   pagination response shape
7. GET /deals supports filtering by `stage` (exact match) and by `owner_id`
   (exact match)
8. GET /deals/:id returns the deal with its linked contact's basic data
   (id, name, email, company) embedded under a `contact` key if
   contact_id is set, or null if not; returns 404 if the deal does not exist
9. PUT /deals/:id updates only the fields provided in the request body,
   updates updated_at, and returns the updated record; owner_id and id
   cannot be changed via this endpoint
10. PUT /deals/:id validates `stage` the same way as POST if stage is being
    changed; an invalid stage value returns 400
11. PUT /deals/:id returns 403 if the authenticated user is not the deal's
    owner; returns 404 if the deal does not exist (404 takes precedence
    over 403, same rule as Spec 4)
12. DELETE /deals/:id deletes the deal and returns 204 only if the
    authenticated user is the owner; returns 403 if authenticated but not
    owner, 404 if the deal does not exist (same precedence as #11)
13. Any authenticated user can read (list, filter, get by id) any deal
    regardless of owner_id
14. npm run build completes with zero TypeScript errors

PAGINATION RESPONSE SHAPE:
Match Spec 4 exactly:
```json
{
  "data": [ /* deal records */ ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 42
  }
}
```

CONSTRAINTS:
- Reuse the existing auth middleware from Spec 3 unmodified
- Follow the same route file structure, error response shapes, and
  ownership-check pattern established in Spec 4's contacts.ts for
  consistency across the codebase
- cuid generation happens in the application layer using createId() from
  @paralleldrive/cuid2, consistent with Spec 4's corrected implementation
- The authenticated user's id (from the session, via the auth middleware's
  context) is the only source of truth for ownership checks; never trust
  an owner_id supplied in the request body
- Validate request bodies before any database call; do not let malformed
  input or invalid foreign keys reach Drizzle and surface as a raw
  database error
- Do not implement soft deletes; DELETE is a hard delete in this spec

OUT OF SCOPE:
- Tasks or interaction_logs routes
- Pipeline aggregation endpoint (covered in a later spec)
- Reporting/metrics endpoints (covered in a later spec)
- Any UI or Kanban rendering logic
- Notifications or webhooks on stage change

EDGE CASES:
- Creating a deal with no contact_id is valid; deals are not required to be
  linked to a contact
- Updating contact_id to reference a non-existent contact returns 400, same
  validation as create
- Updating contact_id to null (unlinking) is allowed
- A filter combination that matches no deals returns an empty data array
  and pagination.total of 0, not a 404
- An `offset` beyond the total record count returns an empty data array,
  not an error

REPORTING REQUIREMENT:
Before finishing, write a REPORT.md file in the project root documenting
your work. The report must include, at minimum:
- A summary of files created and modified
- The full list of endpoints implemented with their methods and status codes
- Build and lint results
- For every acceptance criterion above, the actual raw curl command and raw
  response output used to verify it — not a summary table of checkmarks
  without evidence. A checklist alone is not acceptable; each checkmark
  must be backed by a command and output shown directly above or below it
- A specific raw-output section for ownership enforcement: one user
  attempting to update and delete another user's deal, showing the literal
  403 response, and confirming the response body does not leak the deal's
  actual owner_id or any other deal data
- Any deviation from this spec, however small, reported explicitly rather
  than silently resolved
- Do not claim anything is "verified" based on type-checking, build output,
  or code review alone; only runtime test execution with shown output
  counts as verification

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.