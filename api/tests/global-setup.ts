import { spawn, execSync, type ChildProcess } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

// Integration tests run against the real, unmodified server: we spawn
// `tsx src/index.ts` as a child process pointed at a throwaway SQLite
// file (never /data/basis.db, and outside the repo entirely so it can
// never be committed) and talk to it over HTTP, the same way a real
// client would. This exercises auth, routing, and the DB layer together
// instead of mocking any of them.

const TEST_DB_PATH = resolve(tmpdir(), `basis-test-${process.pid}.db`);
const TEST_PORT = 4310;
export const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let serverProcess: ChildProcess | undefined;
let serverExited = false;

function cleanupDbFiles() {
  for (const suffix of ["", "-wal", "-shm"]) {
    const path = TEST_DB_PATH + suffix;
    if (existsSync(path)) unlinkSync(path);
  }
}

// Polling /health alone isn't enough to prove *our* spawned process is
// the one answering: if the port is already held by a leftover process
// from a previous (improperly torn down) run, /health succeeds against
// that stale process while ours dies on EADDRINUSE, and tests then run
// against a server backed by an already-deleted database file. Racing
// the health check against the child's own exit makes that failure
// loud instead of silently corrupting the run.
async function waitForServer(child: ChildProcess, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (serverExited) {
      throw new Error(
        "Test server process exited before becoming healthy (see stderr above — " +
          "a common cause is something else already bound to port " +
          TEST_PORT +
          ")",
      );
    }
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("Test server did not become healthy in time");
}

export async function setup() {
  cleanupDbFiles();

  const testEnv = {
    ...process.env,
    DATABASE_URL: TEST_DB_PATH,
    BETTER_AUTH_SECRET: "test-secret-do-not-use-in-production",
    BETTER_AUTH_URL: BASE_URL,
    PORT: String(TEST_PORT),
  };

  // Apply migrations to the test database before the server starts.
  execSync("npx drizzle-kit migrate", {
    cwd: resolve(__dirname, ".."),
    env: testEnv,
    stdio: "inherit",
  });

  // `tsx` forks an actual node process separate from its own CLI
  // process, so killing only `serverProcess` later would leave that
  // grandchild (the thing actually bound to the port) running forever.
  // `detached: true` puts the whole tree in a new process group headed
  // by serverProcess.pid, so teardown can kill the group at once.
  serverProcess = spawn("npx", ["tsx", "src/index.ts"], {
    cwd: resolve(__dirname, ".."),
    env: testEnv,
    stdio: "inherit",
    detached: true,
  });

  serverProcess.on("exit", () => {
    serverExited = true;
  });
  serverProcess.on("error", () => {
    serverExited = true;
  });

  await waitForServer(serverProcess, 15000);

  process.env.BASIS_TEST_BASE_URL = BASE_URL;
}

export async function teardown() {
  if (serverProcess && !serverExited && serverProcess.pid) {
    try {
      process.kill(-serverProcess.pid, "SIGKILL");
    } catch {
      // group already gone
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  cleanupDbFiles();
}
