You are implementing the Tasks API for the Basis CRM project.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

FEATURE: Tasks API

OVERVIEW:
Implement CRUD endpoints for the tasks table, including due dates,
completion status, and optional links to a contact and/or a deal. All
routes require a valid authenticated session using the existing middleware
from Spec 3. Visibility and ownership rules match Spec 4 and Spec 5: any
authenticated user can read any task; only the task's owner may update or
delete it.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory for all commands: api/
- Tasks table already exists from Spec 2: id, title, due_at, completed,
  contact_id, deal_id, owner_id, created_at, updated_at
- completed is stored as INTEGER (0 = false, 1 = true)
- due_at is nullable, stored as INTEGER (Unix ms)
- contact_id and deal_id are both nullable; a task may link to a contact, a
  deal, both, or neither (no constraint requires at least one)
- Auth middleware already exists from Spec 3 (api/src/auth/middleware.ts);
  reuse it directly, do not write new auth logic
- Contacts (Spec 4) and Deals (Spec 5) routes already exist and establish
  the structure, error shapes, and 404/403 precedence pattern this spec
  must follow for consistency
- cuid2 is the required id format; use @paralleldrive/cuid2's createId(),
  already installed

NEW FILES:
```
api/
  src/
    routes/
      tasks.ts       # All tasks CRUD, completion toggle, and filter routes
```

ENDPOINTS:
- POST   /tasks          Create a task
- GET    /tasks          List tasks, with filter/pagination
- GET    /tasks/:id      Get a single task
- PUT    /tasks/:id      Update a task, including completion toggle
- DELETE /tasks/:id      Delete a task

ACCEPTANCE CRITERIA:
1. All five endpoints are protected by the existing auth middleware; a
   request with no valid session returns 401 before touching the database
2. POST /tasks creates a task with a server-generated cuid, sets owner_id to
   the authenticated user's id (not from the request body), sets
   created_at/updated_at, and defaults completed to false (0); returns 201
   with the created record
3. POST /tasks rejects a request missing the required `title` field with
   400 before reaching the database
4. POST /tasks accepts an optional `contact_id`; if provided, it must
   reference an existing contact or the request is rejected with 400
5. POST /tasks accepts an optional `deal_id`; if provided, it must
   reference an existing deal or the request is rejected with 400
6. POST /tasks accepts an optional `due_at` as a Unix ms timestamp; if
   provided and not a valid integer timestamp, returns 400
7. GET /tasks returns a paginated list of tasks; default page size is 25,
   configurable via `limit` with a hard cap of 100, matching the pagination
   shape from Spec 4 and Spec 5
8. GET /tasks supports filtering by `completed` (boolean, exact match),
   `owner_id` (exact match), `contact_id` (exact match), and `deal_id`
   (exact match); filters may be combined
9. GET /tasks supports an `overdue` query parameter; when set to true,
   returns only tasks where due_at is in the past and completed is false
10. GET /tasks/:id returns the task, or 404 if it does not exist
11. PUT /tasks/:id updates only the fields provided in the request body,
    updates updated_at, and returns the updated record; owner_id and id
    cannot be changed via this endpoint
12. PUT /tasks/:id allows toggling `completed` independently of other
    fields; setting completed to true does not require other fields to be
    present in the request
13. PUT /tasks/:id validates contact_id and deal_id the same way as POST if
    either is being changed; an invalid reference returns 400
14. PUT /tasks/:id returns 403 if the authenticated user is not the task's
    owner; returns 404 if the task does not exist (404 takes precedence
    over 403, same rule as Spec 4 and Spec 5)
15. DELETE /tasks/:id deletes the task and returns 204 only if the
    authenticated user is the owner; returns 403 if authenticated but not
    owner, 404 if the task does not exist (same precedence as #14)
16. Any authenticated user can read (list, filter, get by id) any task
    regardless of owner_id
17. npm run build completes with zero TypeScript errors

PAGINATION RESPONSE SHAPE:
Match Spec 4 and Spec 5 exactly:
```json
{
  "data": [ /* task records */ ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 17
  }
}
```

CONSTRAINTS:
- Reuse the existing auth middleware from Spec 3 unmodified
- Follow the same route file structure, error response shapes, and
  ownership-check pattern established in contacts.ts and deals.ts for
  consistency across the codebase
- cuid generation happens in the application layer using createId()
- The authenticated user's id (from the session, via the auth middleware's
  context) is the only source of truth for ownership checks; never trust
  an owner_id supplied in the request body
- Validate request bodies before any database call; do not let malformed
  input or invalid foreign keys reach Drizzle and surface as a raw
  database error
- The "overdue" determination must compare due_at against the current
  server time at request time, not a cached or client-supplied time
- Do not implement soft deletes; DELETE is a hard delete in this spec

OUT OF SCOPE:
- Reporting/metrics endpoints, including "upcoming tasks count" (covered in
  a later spec)
- Notifications or reminders (e.g. email, push) when a task is due
- Recurring tasks
- Any UI

EDGE CASES:
- A task with no contact_id and no deal_id is valid; neither link is required
- Updating contact_id or deal_id to null (unlinking) is allowed
- The `overdue` filter with no due_at set on a task excludes that task (a
  task with no due date is never overdue)
- A task with due_at in the past but completed is true must not appear in
  the overdue filter results
- A filter combination that matches no tasks returns an empty data array
  and pagination.total of 0, not a 404
- An `offset` beyond the total record count returns an empty data array,
  not an error

REPORTING REQUIREMENT:
Before finishing, write a REPORT.md file in the project root documenting
your work, following the same standard established in Spec 5's report:
- A summary of files created and modified
- The full list of endpoints implemented with their methods and status codes
- Build and lint results, both shown with actual output
- For every acceptance criterion above, the actual raw curl command and raw
  response output used to verify it — not a summary table of checkmarks
  without evidence
- A specific raw-output section for ownership enforcement: one user
  attempting to update and delete another user's task, showing the literal
  403 response, and confirming the response body does not leak the task's
  actual owner_id or any other task data
- A specific raw-output section for the overdue filter, showing a task
  with a past due_at and completed=false appearing in results, and a task
  with a past due_at and completed=true being excluded
- Any deviation from this spec, however small, reported explicitly rather
  than silently resolved
- Do not claim anything is "verified" based on type-checking, build output,
  or code review alone; only runtime test execution with shown output
  counts as verification

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.