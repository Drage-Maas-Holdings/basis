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

## Placeholder for Future Entries

Future specs or fixes that introduce similar documented tradeoffs should be added here going forward rather than left only in spec files or chat history.
