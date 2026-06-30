You are implementing the Contacts API for the Basis CRM project.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

FEATURE: Contacts API

OVERVIEW:
Implement CRUD endpoints for the contacts table, with search and filtering,
pagination, and ownership enforcement. All routes require a valid
authenticated session using the existing middleware from Spec 3. Any
authenticated user can read any contact (single-team model, no
multi-tenancy). Only the contact's owner may update or delete it.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory for all commands: api/
- Contacts table already exists from Spec 2: id, name, email, phone, company,
  notes, owner_id, created_at, updated_at
- Auth middleware already exists from Spec 3 (api/src/auth/middleware.ts);
  reuse it directly, do not write new auth logic

NEW FILES:
```
api/
  src/
    routes/
      contacts.ts       # All contacts CRUD, search, and filter routes
```

ENDPOINTS:
- POST   /contacts          Create a contact
- GET    /contacts          List contacts, with search/filter/pagination
- GET    /contacts/:id      Get a single contact
- PUT    /contacts/:id      Update a contact
- DELETE /contacts/:id      Delete a contact

ACCEPTANCE CRITERIA:
1. All five endpoints are protected by the existing auth middleware; a
   request with no valid session returns 401 before touching the database
2. POST /contacts creates a contact with a server-generated cuid, sets
   owner_id to the authenticated user's id, and sets created_at/updated_at
   to the current time; returns 201 with the created record
3. POST /contacts rejects a request missing the required `name` field with
   400 before reaching the database
4. GET /contacts returns a paginated list of contacts; default page size is
   25, configurable via a `limit` query parameter with a hard cap of 100
5. GET /contacts supports a `search` query parameter that matches against
   name, email, and company (case-insensitive partial match)
6. GET /contacts supports filtering by `company` as an exact-match query
   parameter
7. GET /contacts/:id returns the contact if it exists, or 404 if it does not
8. PUT /contacts/:id updates only the fields provided in the request body,
   updates updated_at, and returns the updated record; owner_id and id
   cannot be changed via this endpoint
9. PUT /contacts/:id returns 403 if the authenticated user is not the
   contact's owner; returns 404 if the contact does not exist (404 takes
   precedence over 403 if both conditions could apply, i.e. check
   existence before ownership)
10. DELETE /contacts/:id deletes the contact and returns 204 only if the
    authenticated user is the owner; returns 403 if authenticated but not
    the owner, or 404 if the contact does not exist (same precedence as #9)
11. Any authenticated user can read (list, search, get by id) any contact
    regardless of owner_id; this is a single-team model with no
    multi-tenancy or sub-team restrictions
12. npm run build completes with zero TypeScript errors

PAGINATION RESPONSE SHAPE:
```json
{
  "data": [ /* contact records */ ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 142
  }
}
```

CONSTRAINTS:
- Reuse the existing auth middleware from Spec 3 unmodified; if it needs a
  change to support this spec, stop and flag it rather than duplicating
  auth logic in this route file
- The authenticated user's id (from the session, via the auth middleware's
  context) is the only source of truth for ownership checks; never trust
  an owner_id or user id supplied in the request body for authorization
  decisions
- cuid generation happens in the application layer, consistent with Spec 2's
  design decision; do not rely on database-level id generation
- Validate request bodies before any database call; do not let malformed
  input reach Drizzle and surface as a raw database error
- Do not implement soft deletes; DELETE is a hard delete in this spec

OUT OF SCOPE:
- Row-level ownership restriction on read/write access (tracked as a future
  hardening item, see BUILD ORDER NOTE below)
- Deals, tasks, or interaction_logs routes
- Bulk import/export
- Any UI

EDGE CASES:
- A search query with no matches returns an empty data array and
  pagination.total of 0, not a 404
- An `offset` beyond the total record count returns an empty data array,
  not an error
- A PUT or DELETE on a contact owned by a different user must return 403,
  not silently succeed or return a misleading 404 (404 is reserved strictly
  for non-existent contacts, never used to mask an ownership failure)
- Deleting a contact that has linked deals, tasks, or interaction_logs is
  allowed in this spec (those tables do not exist yet at the API level);
  flag if the foreign key constraints from Spec 2 cause a delete failure
  once those tables exist later, since that will need an explicit cascade
  or restrict decision in a future spec

OWNERSHIP MODEL (DECIDED, NOT DEFERRED):
This project has exactly one team per CRM instance (single-tenant, no
multi-tenancy, no sub-teams or departments). Given that, "shared visibility"
and "team visibility" are the same thing in this context: any authenticated
user reading any contact is equivalent to any team member reading any
contact. Write access (update/delete) is restricted to the contact's owner.
This is a deliberate, final decision for this spec, not a placeholder. If a
multi-team or multi-tenant model is ever needed, that is a schema-level
change (introducing a teams table and team_id scoping) requiring its own
spec, not a toggle on this one.

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.