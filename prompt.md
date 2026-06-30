You are migrating the existing Basis CRM scaffold into a monorepo structure.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

FEATURE: Monorepo Restructure

OVERVIEW:
Move the existing API scaffold from the project root into api/, in
preparation for a future web/ service. Update all paths, configuration,
and Docker references so the API continues to build and run correctly from
its new location. No schema, route, or business logic changes are made in
this spec.

CONTEXT:
- Project root: /home/pjmaas/Documents/Code/basis
- Current structure has src/, drizzle.config.ts, Dockerfile,
  docker-compose.yml, tsconfig.json, package.json, .env.example, and .env
  all at the project root
- Target structure moves the API-specific files into api/, leaving
  docker-compose.yml at the project root as the orchestration point for
  future services

TARGET STRUCTURE:
```
basis/
  api/
    src/
      db/
        client.ts
        schema.ts
        migrations/
      routes/
        health.ts
      index.ts
    drizzle.config.ts
    Dockerfile
    tsconfig.json
    package.json
    .env.example
    .env
  docker-compose.yml
```

MIGRATION STEPS:
1. Create the api/ directory
2. Move src/, drizzle.config.ts, Dockerfile, tsconfig.json, package.json,
   .env.example, and .env from the project root into api/
3. Update drizzle.config.ts so its schema path and migrations output path
   are correct relative to its new location inside api/
4. Update package.json scripts (db:generate, db:migrate, db:studio, build)
   if any contain relative paths that assumed the project root
5. Update the Dockerfile's build context assumptions if it references paths
   relative to the old root (e.g. COPY instructions)
6. Update docker-compose.yml at the project root so the api service's build
   context points to ./api instead of the project root
7. Verify the named volume and 127.0.0.1:3000:3000 port binding from Spec 1
   are preserved unchanged in the updated docker-compose.yml
8. Remove any now-empty directories left behind at the project root after
   the move

ACCEPTANCE CRITERIA:
1. All API source files and configuration live under api/
2. docker-compose.yml at the project root still builds and starts the api
   service successfully via docker compose up --build
3. GET /health returns HTTP 200 with { "status": "ok" } after the move
4. npm run build completes with zero TypeScript errors from within api/
5. npm run db:generate and npm run db:migrate work correctly from within
   api/ and continue to read/write src/db/migrations/ in its new location
6. npm run db:studio starts correctly from within api/
7. The SQLite data volume continues to persist across container restarts
   after the restructure
8. No files outside api/ and docker-compose.yml are modified

CONSTRAINTS:
- Do not change any schema definitions, table structures, or migration content
- Do not change the Node version, base image, or non-root user setup from
  Spec 1
- Do not add a web/ directory or any web-related files in this spec
- The port binding (127.0.0.1:3000:3000) and non-root container user
  (appuser) must be preserved exactly as specced in Spec 1

OUT OF SCOPE:
- Creating the web/ service
- Wiring docker-compose.yml to orchestrate a second service
- Any schema or route changes (Spec 2 work)
- Updating README.md, PRD.md, or spec_2.md (handled separately)

EDGE CASES:
- If any npm script or Dockerfile instruction assumes it is running from the
  project root rather than api/, it must be corrected, not worked around
- If the .env file was previously untracked (git-ignored), confirm it still
  exists at its new path and is not accidentally lost during the move

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.