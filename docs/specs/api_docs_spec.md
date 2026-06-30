# API Docs Spec

## Overview

This spec covers the work required to produce accurate, auto-generated API
documentation for Basis CRM. It is broken into four sequential sub-prompts,
each with its own validation criteria. Do not move to the next sub-prompt
until the current one's validation criteria are fully met with runtime
evidence.

The end state: every route in the API is defined with Zod schemas via
@hono/zod-openapi, an OpenAPI 3.1 spec is generated automatically from
those schemas, and docs/api.md is produced from that spec. A regression
test suite gates the refactor so existing verified behavior cannot be
silently broken.

**Prerequisite:** The API is fully implemented and verified through Spec 10.
Do not begin this work until all ten specs are committed and passing.

---

## Sub-prompt 1: Integration Test Suite

### Objective
Write a complete integration test suite that proves the current API behavior
before any refactoring begins. These tests become the regression gate for
all subsequent work in this spec.

### Prompt

You are writing an integration test suite for the Basis CRM API.
Use the following as your single source of truth.
Do not make assumptions about behavior not described here.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory: api/
- Test framework: Vitest
- Tests run against the actual live server (integration tests, not unit
  tests); start the server programmatically in test setup or run against
  a dev server started before the test run — document which approach you
  use and why
- Use a separate test database (not /data/basis.db); configure via
  environment variable in the test setup
- All tests must be independent and not rely on state from other tests;
  seed required data in each test or use beforeEach/afterEach cleanup

COVERAGE REQUIRED:

For every endpoint in the API (auth, contacts, deals, tasks,
interaction-logs, pipeline, reports, api-tokens), write tests covering:

1. Authentication gate: unauthenticated request returns 401
2. Happy path: valid request with valid auth returns expected status and
   response shape
3. Validation: missing required fields return 400
4. Not found: requests for non-existent resources return 404
5. Ownership: non-owner attempting write (PUT/DELETE) on another user's
   record returns 403
6. For pipeline: all four stages present even when empty
7. For reports: zero-result ranges return count 0, not errors
8. For api-tokens: POST with token auth (not session) is rejected

ACCEPTANCE CRITERIA:
- All tests pass against the current unmodified API
- Test run output shows pass/fail for each test case explicitly
- No test relies on shared mutable state between test cases
- npm run test exits with code 0

REPORTING REQUIREMENT:
- Show the full test run output with pass/fail counts
- List any endpoint or behavior that could not be covered and why
- Do not mark this sub-prompt complete until npm run test exits 0

### Validation Criteria
- `npm run test` exits with code 0 with no skipped tests
- Test output shows explicit pass/fail per test case, not just a summary
- At minimum one test per endpoint covers each of the 8 categories above
- Test database is separate from the development database and cleaned up
  after the run

---

## Sub-prompt 2: OpenAPI / Zod Refactor

### Objective
Refactor all route files to use @hono/zod-openapi, defining Zod schemas
for every request, response, and error shape. The existing integration
tests from Sub-prompt 1 must pass without modification after the refactor.

### Prompt

You are refactoring the Basis CRM API routes to use @hono/zod-openapi.
Use the following as your single source of truth.
Do not make assumptions about behavior not described here.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory: api/
- Install @hono/zod-openapi and zod if not already present
- The existing integration test suite (Sub-prompt 1) must pass unchanged
  after this refactor; do not modify the tests to accommodate schema
  changes — if a test fails, fix the schema, not the test
- All ten route files must be converted: health, auth, contacts, deals,
  tasks, interaction-logs, pipeline, reports, api-tokens

REQUIREMENTS:

1. Replace the Hono app instance in index.ts with OpenAPIHono
2. For each route, define:
   - Request body schema (Zod, where applicable)
   - Query parameter schema (Zod, where applicable)
   - Response schema for each status code the route can return (200/201,
     400, 401, 403, 404)
   - Route metadata (summary, tags, operationId)
3. Generate the OpenAPI spec at GET /openapi.json (unauthenticated, since
   this is documentation)
4. All existing behavior must remain identical; the Zod schemas describe
   what the routes already do, not a new contract
5. Do not add new validation that did not exist before; if a route
   previously accepted a field without strict type validation, match that
   behavior in the Zod schema rather than tightening it silently

CONSTRAINTS:
- Do not change any route's status codes, response shapes, or error
  message strings — the schemas must match the existing behavior exactly
- The auth middleware from Spec 3 and Spec 10 must continue to work
  without changes
- If @hono/zod-openapi's conventions conflict with the existing routing
  patterns, stop and document the conflict rather than silently resolving
  it in a way that changes behavior

ACCEPTANCE CRITERIA:
- npm run test (Sub-prompt 1 suite) exits with code 0, no test changes
- GET /openapi.json returns a valid OpenAPI 3.1 document
- npm run build completes with zero TypeScript errors
- Every endpoint appears in the OpenAPI spec with correct methods, paths,
  request schemas, and response schemas

REPORTING REQUIREMENT:
- Show npm run test output after the refactor (full pass/fail)
- Show a truncated but representative sample of the generated
  /openapi.json to confirm it is valid and complete
- Document any place where the existing behavior required a looser Zod
  schema than you would normally write (e.g. a field that is typed as
  string but has no further validation in the route)
- List any deviation from the existing API behavior, however small

### Validation Criteria
- `npm run test` exits 0 with no test modifications
- `GET /openapi.json` returns HTTP 200 with a valid OpenAPI 3.1 document
- Every route from Specs 4-10 appears in the spec
- `npm run build` exits 0
- No existing route behavior changed (confirmed by passing tests)

---

## Sub-prompt 3: Generate docs/api.md

### Objective
Generate docs/api.md from the OpenAPI spec produced in Sub-prompt 2. The
output must be a useful, readable reference document, not a raw dump of
the spec.

### Prompt

You are generating docs/api.md for the Basis CRM API from the OpenAPI
spec at GET /openapi.json.
Use the following as your single source of truth.
Do not make assumptions about content not in the spec.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- The OpenAPI spec is available at GET /openapi.json (server must be
  running)
- Output file: docs/api.md (create the docs/ directory if it does not
  exist)

DOCUMENT STRUCTURE:
1. Introduction (one short paragraph: what the API is, base URL, auth
   methods)
2. Authentication section (session-based and API token, how to pass each,
   what 401 looks like)
3. Pagination section (the shared pagination shape used across list
   endpoints, limit/offset/total)
4. Ownership model (one short paragraph: shared reads, owner-only writes,
   403 vs 404 precedence)
5. One section per resource group, in this order:
   - Auth (/auth/*)
   - Contacts
   - Deals
   - Tasks
   - Interaction Logs
   - Pipeline
   - Reports
   - API Tokens
6. For each endpoint within a section:
   - Method and path
   - One-sentence description
   - Auth requirement (session only, session or token)
   - Request parameters (query params, body fields, types, required/optional)
   - Response shape (success and key error cases)
   - A concrete curl example

CONSTRAINTS:
- Derive all content from the OpenAPI spec, not from memory or the spec
  files; if something is not in the spec, it does not go in the docs
- Do not invent examples; use realistic but obviously fake values
  (e.g. cuid2-format ids, example.com emails)
- Keep language direct and technical; this is a reference doc, not a
  tutorial

ACCEPTANCE CRITERIA:
- docs/api.md exists and covers all endpoints in the OpenAPI spec
- Every endpoint has a curl example
- The pagination and ownership model sections accurately reflect the API's
  actual behavior
- The document renders correctly as Markdown (no broken tables, no
  unclosed code blocks)

REPORTING REQUIREMENT:
- Confirm the doc was generated from the live spec, not from memory
- Note any endpoint that could not be fully documented from the spec alone
  and what information was missing

### Validation Criteria
- `docs/api.md` exists in the repo
- Every endpoint from the OpenAPI spec has a corresponding entry
- Every entry has a curl example
- Document renders without errors in a Markdown previewer

---

## Sub-prompt 4: Wire /openapi.json into README

### Objective
Update README.md to reflect that API documentation now exists and is
auto-generated. Replace the placeholder `docs/api.md` link with a real
one and add a note about the live OpenAPI spec endpoint.

### Prompt

You are making two small, targeted updates to README.md.
Do not change anything else.

CHANGES:
1. In the API overview section, update the `docs/api.md` link so it
   points to the actual file that now exists
2. Add a single sentence noting that a machine-readable OpenAPI 3.1 spec
   is available at GET /openapi.json when the server is running
3. Update the Contributing section to note that new routes must include
   Zod schemas and appear in the OpenAPI spec before a PR will be accepted

ACCEPTANCE CRITERIA:
- README.md has exactly three changes from its current state (the two
  additions above plus the contributing note)
- No other content in README.md is modified
- The docs/api.md link resolves correctly relative to the repo root

REPORTING REQUIREMENT:
- Show a diff of the README changes

### Validation Criteria
- `docs/api.md` link in README resolves to the file created in
  Sub-prompt 3
- `/openapi.json` endpoint is mentioned
- Contributing section updated
- No other README content changed (confirmed by diff)

---

## Build Order Summary

| # | Sub-prompt | Depends On | Key Validation |
|---|---|---|---|
| 1 | Integration Test Suite | Specs 1-10 complete | `npm run test` exits 0 |
| 2 | OpenAPI / Zod Refactor | Sub-prompt 1 passing | Tests still pass, `/openapi.json` returns valid spec |
| 3 | Generate docs/api.md | Sub-prompt 2 complete | All endpoints documented with curl examples |
| 4 | Wire into README | Sub-prompt 3 complete | README diff shows exactly three changes |

Do not skip sub-prompts or run them out of order. The test suite in
Sub-prompt 1 is the safety net for everything that follows.