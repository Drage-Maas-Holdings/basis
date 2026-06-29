You are scaffolding the Basis CRM project.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

FEATURE: Project Scaffold

OVERVIEW:
Initialize the Basis CRM repository with a Hono API server, TypeScript
configuration, Drizzle ORM wired to a SQLite database, and a Docker Compose
setup that mounts a persistent volume for the database file. The output is a
running server with a health check endpoint and a verified database connection.
No business logic is implemented in this spec.

STACK:
- Runtime: Node.js 20
- Framework: Hono
- Language: TypeScript
- ORM: Drizzle with drizzle-kit
- Database: SQLite via better-sqlite3
- Container: Docker Compose

FOLDER STRUCTURE:
```
basis/
  src/
    db/
      client.ts       # Drizzle client instantiation
      schema.ts       # Empty schema file, tables added in Spec 02
      migrations/     # Migration files output directory (generated, do not edit manually)
    routes/
      health.ts       # Health check route
    index.ts          # Hono app entry point
  drizzle.config.ts   # Drizzle kit configuration
  docker-compose.yml
  Dockerfile
  .env.example
  .env                # Git-ignored
  tsconfig.json
  package.json
```

ACCEPTANCE CRITERIA:
1. `docker compose up` builds and starts the container without errors
2. `GET /health` returns HTTP 200 with the JSON body `{ "status": "ok" }`
3. Drizzle client connects to the SQLite file at the path specified by
   DATABASE_URL without throwing on startup
4. `npm run db:migrate` runs without error against the SQLite file
5. `npm run db:studio` starts Drizzle Studio without error
6. TypeScript compiles without errors via `npm run build`
7. The SQLite file is written to a Docker volume and persists across
   container restarts

ENVIRONMENT VARIABLES:
- DATABASE_URL — absolute path to the SQLite file inside the container
  (example: /data/basis.db)
- PORT — port the Hono server listens on (default: 3000)

DOCKER REQUIREMENTS:
- The API port must be bound to 127.0.0.1 only: `127.0.0.1:3000:3000`
- The SQLite data directory must be mounted as a named volume at /data
- The Dockerfile must use the Node 20 Alpine base image
- The container must not run as root; create and use a non-root user

DRIZZLE CONFIGURATION:
- Dialect: sqlite
- Schema path: src/db/schema.ts
- Output directory for migrations: src/db/migrations/
- Database URL read from environment variable DATABASE_URL

OUT OF SCOPE:
- Any database tables or schema definitions (covered in Spec 02)
- Authentication or middleware (covered in Spec 03)
- Any business logic routes (covered in Specs 04 onwards)
- Production TLS or reverse proxy configuration

EDGE CASES:
- If DATABASE_URL is not set, the server must throw a descriptive error
  on startup rather than failing silently
- If the /data directory is not writable, the error must surface clearly
  in container logs

Do not begin implementation until you have confirmed your understanding
of the acceptance criteria.
