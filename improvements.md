# Improvements & Known Limitations

This file tracks known limitations, deferred decisions, and candidate future work across the Basis CRM project.

---

## stage_changed_at: Lightweight Fix, Not Full History

**Date:** 2026-06-30
**Context:** Spec 9 — Reporting Endpoints

Reporting is intended to become a cornerstone feature of this project, but the exact reporting requirements are not yet fully defined as of this point in development.

The original deals-summary implementation used `updated_at` as a proxy for "when did this deal close," which was inaccurate for any deal edited after its stage changed. This was identified and fixed by adding a dedicated `stage_changed_at` column, set only on actual stage transitions.

This `stage_changed_at` column is a lightweight, single-timestamp solution, not a full stage-history table. It captures only the most recent stage transition, not a complete audit trail of every stage change a deal has gone through over its lifetime.

A full stage-history table (tracking every transition with timestamps, not just the latest one) is a candidate future improvement if reporting needs grow to require historical trend analysis (e.g. "how long do deals typically stay in qualified before moving to won").

---

## API Key Plugin: Direct DB Queries vs Plugin Methods for List/Delete

**Date:** 2026-06-30
**Context:** Spec 10 — API Token Support

The `@better-auth/api-key` plugin provides `listApiKeys` and `deleteApiKey` methods, but these have internal session middleware that cannot authenticate requests made via Bearer token without enabling `enableSessionForAPIKeys` (which creates mock sessions from API keys — a feature with broader security implications). The project's GET and DELETE /api-tokens routes use direct Drizzle queries on the `apikey` table instead, which works identically for both session and token-authenticated requests.

A future improvement could switch to the plugin's built-in list/delete methods by enabling `enableSessionForAPIKeys` if mock sessions are deemed acceptable, but this should be evaluated carefully since it changes how the plugin behaves for all requests, not just these two endpoints.

---

## API Key Rate Limiting: Explicitly Disabled

**Date:** 2026-06-30
**Context:** Spec 10 — API Token Support

The `@better-auth/api-key` plugin enables per-key rate limiting by default (10 requests/day). This was explicitly disabled in `api/src/auth/config.ts` via `rateLimit: { enabled: false }` because:

- This project's API tokens are intended for service-to-service integration (n8n, external dashboards), not for end-user browser sessions. These integrations may legitimately need to make many requests in quick succession.
- The existing Hono application-layer rate limiting (if added in the future) would be a more appropriate place for global rate limiting, rather than per-token limits that users cannot observe or control.
- Disabling it was a deliberate choice, not an oversight. If rate limiting is needed in the future, it should be implemented at the application layer (e.g., Hono middleware) with clear per-endpoint or per-user limits visible to API consumers.

---

## Placeholder for Future Entries

Future specs or fixes that introduce similar documented tradeoffs should be added here going forward rather than left only in spec files or chat history.
