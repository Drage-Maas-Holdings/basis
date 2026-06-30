You are implementing API Token Support for the Basis CRM project.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

Before writing any code, consult Better Auth's official API Key plugin
documentation (@better-auth/api-key) for setup, configuration, and route
conventions. This spec is intentionally built around that plugin rather
than a custom token table, to avoid duplicating authentication logic
Better Auth already provides and tested. Where the plugin's conventions
conflict with anything stated in this spec, the plugin's documented
implementation pattern takes precedence for *how* something is built; this
spec's ACCEPTANCE CRITERIA and CONSTRAINTS still define *what* must be
true when you are done. If a conflict is unresolvable without changing an
acceptance criterion, stop and ask rather than silently deviating.

FEATURE: API Token Support

OVERVIEW:
Allow authenticated users to generate long-lived API tokens for
service-to-service integration (n8n, external dashboards), independent of
session-based browser login. A user may have multiple active tokens at
once, each independently named, listed, and revocable. Tokens do not
expire automatically; they remain valid until explicitly revoked. Token
auth must work alongside the existing session auth middleware from Spec 3
on every protected route, not just a new set of routes.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory for all commands: api/
- Auth is built on Better Auth (Spec 3), configured in
  api/src/auth/config.ts, with session middleware in
  api/src/auth/middleware.ts
- This spec adds the @better-auth/api-key plugin to the existing Better
  Auth instance rather than building a separate token table or separate
  verification logic
- All protected routes built in Specs 4 through 9 (contacts, deals, tasks,
  interaction-logs, pipeline, reports) must accept a valid API token as an
  alternative to a session cookie, with no changes required to those route
  files themselves — the auth middleware is the single point of extension

PLUGIN INSTALLATION AND CONFIGURATION:
1. Install @better-auth/api-key (server) and, only if your existing
   client-side auth setup uses better-auth/client, @better-auth/api-key's
   client plugin — confirm whether this project has a client-side auth
   setup at all before adding the client plugin; if it does not (this is
   an API-only backend per the project's architecture), skip the client
   plugin entirely
2. Add the apiKey() plugin to the existing Better Auth instance in
   api/src/auth/config.ts
3. Run the database migration/generation step the plugin requires
   (e.g. npx auth migrate or npx auth generate, per the plugin's docs) to
   add its necessary tables/fields; this happens independently of
   Drizzle's own migration files, follow the plugin's documented process
   for this project's setup
4. Configure the plugin so that, by default, generated keys do NOT expire:
   explicitly set the default expiresIn behavior to non-expiring, since
   the plugin's own default is 7 days and this project requires
   non-expiring tokens per ACCEPTANCE CRITERIA below
5. Configure a sensible key prefix for this project (e.g. "basis_") so
   generated tokens are visually identifiable

NEW FILES:
```
api/
  src/
    routes/
      api-tokens.ts     # Thin route handlers wrapping the plugin's
                         # create/list/delete API, scoped to this
                         # project's response shape and auth rules
```

ENDPOINTS:
- POST   /api-tokens          Generate a new token (requires session auth,
                               not token auth, see CONSTRAINTS)
- GET    /api-tokens          List the authenticated user's tokens
                               (metadata only, never the actual key)
- DELETE /api-tokens/:id      Revoke (delete) a token

ACCEPTANCE CRITERIA:
1. POST /api-tokens requires session-based authentication (a logged-in
   browser session); it must not be callable using an existing API token,
   to prevent a leaked token from being used to mint further tokens
   indefinitely. Verify how the plugin's own create endpoint handles this
   by default and add an explicit check in this project's route handler
   if the plugin does not already enforce it
2. POST /api-tokens accepts a required `name` field; rejects with 400 if
   missing or empty, before calling the plugin
3. POST /api-tokens returns the full plaintext key exactly once in the
   response body, via the plugin's create method; the plaintext value is
   never retrievable again after this response, consistent with the
   plugin's documented behavior (the key value is omitted from get/list
   results)
4. POST /api-tokens does not set a custom expiresIn unless explicitly
   intended; confirm the plugin-level non-expiring default from
   configuration step 4 actually takes effect for keys created through
   this route
5. GET /api-tokens requires authentication (session or token, either is
   fine for this read) and returns only the authenticated user's own
   tokens, using the plugin's list method, mapped to this project's
   response shape: id, name, prefix/display value, createdAt, lastUsedAt
   if available, and active/enabled status — never the raw key
6. DELETE /api-tokens/:id deletes/revokes a token owned by the
   authenticated user via the plugin's delete method; returns 204
7. DELETE /api-tokens/:id returns 403 if the token exists but is not owned
   by the authenticated user, or 404 if it does not exist at all (404
   precedence over 403, consistent with the rest of the API). If the
   plugin's own delete method already enforces ownership and throws an
   APIError on mismatch, map that error to this project's standard 403/404
   response shapes rather than letting the plugin's raw error format leak
   through
8. A revoked/deleted token must immediately fail authentication on any
   subsequent request; verify this is the plugin's actual behavior rather
   than assuming it
9. The auth middleware (api/src/auth/middleware.ts) is extended to accept
   an API token via the `Authorization: Bearer <token>` header, using the
   plugin's verify method, as an alternative to a session cookie; if both
   are present, session takes precedence (this is a minor, low-stakes
   ordering decision, document it if you choose differently)
10. An invalid, malformed, or revoked token in the Authorization header
    returns 401, with the same generic error shape used elsewhere in the
    API (no distinction in the response between "invalid format,"
    "unknown key," and "revoked key" — all return the same 401 body,
    even though the plugin's own verify result may distinguish these
    internally)
11. A request to any existing protected route (contacts, deals, tasks,
    interaction-logs, pipeline, reports) using a valid API token instead
    of a session cookie succeeds identically to a session-authenticated
    request, with no changes to those route files
12. npm run build completes with zero TypeScript errors

CONSTRAINTS:
- Do not build a custom token table, custom hashing, or custom
  verification logic; use the plugin's built-in create, verify, list, and
  delete methods as the implementation, with this project's route files
  acting as thin wrappers that enforce this project's specific auth and
  response-shape requirements
- Do not enable or configure features this project does not need: no
  organization-owned keys, no custom rate limiting beyond the plugin's
  defaults (if the plugin enables rate limiting by default, leave it on
  rather than disabling it, since it costs nothing and adds a safety
  margin, but do not build a custom rate limiting system on top of it)
- Do not enable the refill/remaining-count system; this project's tokens
  are not request-budget-limited
- POST /api-tokens must require session auth specifically, not token auth,
  per AC-1; implement this as an explicit check in this project's route
  handler if the plugin's own endpoint does not already guarantee it
- Reuse existing error response shapes and the 404/403 precedence pattern
  established in Specs 4 through 9; translate the plugin's own error
  format into this project's conventions at the route layer, do not leak
  the plugin's raw error shape to API consumers
- Do not change the response shape or behavior of any existing route in
  Specs 4 through 9; the only change to existing code should be the auth
  middleware itself and the new auth plugin configuration

OUT OF SCOPE:
- Token expiry or auto-rotation (explicitly disabled per configuration
  step 4)
- Scoped/restricted-permission tokens (the plugin supports permissions;
  do not configure or expose this in this spec)
- Organization-owned keys
- Any UI for managing tokens
- OAuth or any third-party token issuance flow

EDGE CASES:
- A user with zero tokens calling GET /api-tokens gets an empty array, not
  an error
- Deleting an already-deleted/revoked token should not error
  destructively; verify the plugin's actual behavior for this case and
  document it — if the plugin returns an error for double-deletion, map
  it to a 404 in this project's response (since the token is, from the
  consumer's perspective, gone) rather than letting a raw plugin error
  surface
- A malformed Authorization header (e.g. missing "Bearer " prefix, empty
  token) must return 401, not 500, consistent with Spec 3's existing
  malformed-header handling

REPORTING REQUIREMENT:
Before finishing, write a REPORT.md file in the project root documenting
your work, following the same standard established in prior specs:
- A summary of files created and modified, including the plugin
  installation, configuration changes to auth/config.ts, and the
  migration/generation step the plugin required
- Build and lint results, both shown with actual output
- For every acceptance criterion above, the actual raw curl command and
  raw response output used to verify it — not a summary table of
  checkmarks without evidence
- Explicit verification that POST /api-tokens rejects an attempt to call
  it using an existing API token instead of a session
- Explicit verification that a revoked/deleted token immediately fails on
  a subsequent request to a protected route (e.g. GET /contacts)
- Explicit verification that a token successfully authenticates against
  at least one route from each of Specs 4 through 9 (contacts, deals,
  tasks, interaction-logs, pipeline, reports) — this is the integration
  point most likely to have a subtle bug, treat it accordingly
- Explicit confirmation, with evidence, that tokens created through this
  project's POST /api-tokens route do not expire (verify the configured
  non-expiring default actually took effect, do not assume it from the
  configuration alone)
- Confirmation that the plaintext key is never stored or logged anywhere
  outside the single create response that returns it
- Any deviation from this spec, however small, reported explicitly rather
  than silently resolved, including any place the plugin's actual
  behavior differs from its documentation
- Do not claim anything is "verified" based on type-checking, build
  output, or code review alone; only runtime test execution with shown
  output counts as verification

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.