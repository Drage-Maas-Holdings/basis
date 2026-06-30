You are implementing the Pipeline Endpoint for the Basis CRM project.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

FEATURE: Pipeline Endpoint

OVERVIEW:
Implement a single read-only endpoint that returns deals grouped by stage,
in a shape suitable for rendering a Kanban-style pipeline view. This is an
aggregation over the existing deals table from Spec 5; no new tables or
write logic are introduced. The route requires a valid authenticated
session using the existing middleware from Spec 3.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Working directory for all commands: api/
- Deals table already exists from Spec 5: id, title, stage, value,
  contact_id, owner_id, created_at, updated_at
- stage is constrained to: new, qualified, won, lost
- value is nullable INTEGER in minor currency units (cents)
- Auth middleware already exists from Spec 3 (api/src/auth/middleware.ts);
  reuse it directly, do not write new auth logic
- Deals route already exists (api/src/routes/deals.ts); this spec adds a
  new route file, it does not modify deals.ts unless explicitly justified
- Visibility matches the rest of the API: any authenticated user can read
  the full pipeline regardless of deal ownership

NEW FILES:
```
api/
  src/
    routes/
      pipeline.ts       # GET /pipeline aggregation route
```

ENDPOINT:
- GET /pipeline    Returns all deals grouped by stage with counts and totals

ACCEPTANCE CRITERIA:
1. The endpoint is protected by the existing auth middleware; a request
   with no valid session returns 401 before touching the database
2. The response groups deals into all four stages (new, qualified, won,
   lost), even if a stage currently has zero deals — every stage key is
   always present in the response, never omitted
3. Each stage group includes: the array of deals in that stage, a count of
   deals in that stage, and a total value (sum of the `value` field for
   deals in that stage, treating null values as 0 in the sum, in minor
   currency units)
4. The response includes an overall summary: total deal count across all
   stages, and total value across all stages
5. The endpoint supports an optional `owner_id` query parameter; when
   provided, only deals owned by that user are included in the grouping,
   counts, and totals
6. When filtered by owner_id, stages with no matching deals still appear
   in the response with an empty array, count of 0, and total of 0
   (consistent with criterion 2)
7. Each deal in the response includes its linked contact's basic data
   (id, name, company) embedded under a `contact` key, consistent with how
   GET /deals/:id behaves in Spec 5, or null if no contact is linked
8. npm run build completes with zero TypeScript errors

RESPONSE SHAPE:
```json
{
  "stages": {
    "new": {
      "deals": [ /* deal records, each with embedded contact or null */ ],
      "count": 3,
      "total": 150000
    },
    "qualified": {
      "deals": [],
      "count": 2,
      "total": 80000
    },
    "won": {
      "deals": [],
      "count": 1,
      "total": 50000
    },
    "lost": {
      "deals": [],
      "count": 0,
      "total": 0
    }
  },
  "summary": {
    "totalCount": 6,
    "totalValue": 280000
  }
}
```

CONSTRAINTS:
- Reuse the existing auth middleware from Spec 3 unmodified
- This is a read-only endpoint; no POST, PUT, or DELETE logic belongs here
- Do not duplicate the contact-embedding logic from deals.ts by copy-paste
  if it can reasonably be extracted into a small shared helper function;
  if extracting it requires touching deals.ts, do so minimally and note
  the change explicitly in your report
- This endpoint must not paginate; it returns the full pipeline in one
  response, since the use case is rendering a complete Kanban board, not
  browsing a list. If deal volume ever makes this impractical, that is a
  future spec's concern, not this one's
- Stage values are read directly from the existing CHECK constraint set in
  Spec 2 (new, qualified, won, lost); do not hardcode a different or
  expanded set of stages

OUT OF SCOPE:
- Pagination of any kind on this endpoint
- Filtering by anything other than owner_id (e.g. no date range filtering,
  no contact_id filtering on this endpoint)
- Reporting/metrics endpoints beyond this single aggregation (leads added,
  deals won/lost over time, upcoming tasks count — these belong to Spec 9)
- Any UI or actual Kanban rendering

EDGE CASES:
- A CRM with zero deals returns all four stages present with empty arrays,
  zero counts, and zero totals, plus a summary of totalCount: 0,
  totalValue: 0 — not an error and not an omitted stages object
- owner_id filtering for a user who owns no deals returns the same
  all-zero shape, not a 404
- Deals with a null `value` are counted toward `count` but contribute 0 to
  `total`, not null or NaN

REPORTING REQUIREMENT:
Before finishing, write a REPORT.md file in the project root documenting
your work, following the same standard established in prior specs:
- A summary of files created and modified
- Build and lint results, both shown with actual output
- For every acceptance criterion above, the actual raw curl command and raw
  response output used to verify it — not a summary table of checkmarks
  without evidence
- Explicit verification of the zero-deals edge case and the owner_id
  filtering edge case, both with raw output
- Explicit verification that a stage with zero matching deals still
  appears in the response with the correct empty/zero shape
- Any deviation from this spec, however small, reported explicitly rather
  than silently resolved
- Do not claim anything is "verified" based on type-checking, build
  output, or code review alone; only runtime test execution with shown
  output counts as verification

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.