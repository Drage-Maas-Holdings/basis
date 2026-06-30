You are implementing authentication for the Basis CRM project.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

Before writing any code, consult your locally installed better-auth skill
for setup conventions, configuration patterns, and any Hono-specific
integration guidance it provides. Where the skill's conventions conflict
with anything stated in this spec, the skill's technical implementation
guidance takes precedence for *how* something is built; this spec's
ACCEPTANCE CRITERIA and CONSTRAINTS still define *what* must be true when
you are done. If a conflict is unresolvable without changing an acceptance
criterion, stop and ask rather than silently deviating.

FEATURE: Auth

OVERVIEW:
Integrate Better Auth with the Hono API to provide email and password
registration, login, and session-based authentication. Add middleware that
protects routes behind a valid session. No business logic routes (contacts,
deals, tasks, logs) are implemented in this spec.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory for all commands below: api/
- App entry point: api/src/index.ts
- Schema file: api/src/db/schema.ts (users table already exists from Spec 2)
- Database client: api/src/db/client.ts

NEW FILES:
```
api/
  src/
    auth/
      config.ts        # Better Auth instance configuration
      middleware.ts     # Hono middleware that validates session and
                         # attaches the authenticated user to context
    routes/
      auth.ts           # Mounts Better Auth's handler at /auth/*
```

ACCEPTANCE CRITERIA:
1. POST /auth/register accepts email, password, and name; creates a user
   record with a hashed password; returns a session token
2. POST /auth/login accepts email and password; returns a valid session
   token on success
3. POST /auth/login returns HTTP 401 with a generic error message on
   invalid credentials (do not indicate whether the email or password was
   wrong)
4. Passwords are hashed before storage; the plaintext password is never
   written to the database or logged
5. A protected test route (e.g. GET /auth/me) returns the authenticated
   user's id, email, and name when called with a valid session token
6. The same protected route returns HTTP 401 when called with no token or
   an invalid/expired token
7. Session tokens expire and are rejected after expiry; expiry duration is
   configurable via environment variable
8. npm run build completes with zero TypeScript errors after these changes

CONSTRAINTS:
- Use Better Auth's built-in email and password provider; do not write
  custom password hashing or session logic
- Better Auth must use the existing Drizzle client and users table from
  Spec 2; do not let Better Auth create its own separate user table or
  duplicate schema
- The middleware must be reusable across all future protected routes
  (contacts, deals, tasks, logs); it must not be route-specific
- Generic error message on failed login must not differ in timing or
  response shape based on whether the email exists (avoid user enumeration)

ENVIRONMENT VARIABLES:
- BETTER_AUTH_SECRET — secret used to sign session tokens; required, server
  must fail to start with a descriptive error if not set
- SESSION_EXPIRY_SECONDS — session token lifetime in seconds (example
  default: 604800 for 7 days)

DESIGN DECISIONS:
- Better Auth is wired directly to the existing users table rather than
  generating its own schema; this keeps the cuid-based id generation and
  application-layer control over the users table established in Spec 2
- Session-based auth is used now; API token support for service-to-service
  integration (n8n, external dashboards) is deferred to a later spec and
  must not be built here

OUT OF SCOPE:
- API token / service key authentication (covered in a later spec)
- Password reset flow
- Email verification
- Two-factor authentication
- Social/OAuth login
- Rate limiting on login attempts (do not implement; flag if Better Auth
  does not handle this by default, but do not build a custom solution here)
- Any contacts, deals, tasks, or interaction_logs routes

EDGE CASES:
- Registering with an email that already exists must return a clear error
  without leaking whether the conflict is on email specifically versus a
  generic validation failure, consistent with the no-enumeration constraint
- Empty or malformed email/password on register or login must be rejected
  with a 400 before reaching the database
- A request to a protected route with a malformed Authorization header
  (not a valid token format) must return 401, not 500

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.