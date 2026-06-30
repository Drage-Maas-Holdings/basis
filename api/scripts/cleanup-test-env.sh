#!/usr/bin/env bash
#
# Cleans up everything the integration test suite (tests/global-setup.ts)
# can leave behind when a run is killed externally (Ctrl-C, an agent
# being interrupted, etc.) instead of exiting normally through teardown:
#
#   - the test server (tsx running src/index.ts) and any of its
#     grandchild node processes bound to the test port
#   - leftover throwaway SQLite test databases in the OS tmpdir
#
# Safe to run any time, including while no tests are running.

set -euo pipefail

TEST_PORT="${BASIS_TEST_PORT:-4310}"

echo "Looking for processes bound to port ${TEST_PORT}..."
PIDS="$(lsof -ti tcp:"${TEST_PORT}" 2>/dev/null || true)"
if [ -n "${PIDS}" ]; then
  echo "Killing PID(s) on port ${TEST_PORT}: ${PIDS}"
  # shellcheck disable=SC2086
  kill -9 ${PIDS} 2>/dev/null || true
else
  echo "Nothing bound to port ${TEST_PORT}."
fi

echo "Looking for stray tsx/test-server processes..."
pkill -9 -f "tsx src/index.ts" 2>/dev/null && echo "Killed stray tsx src/index.ts process(es)." || echo "None found."

TMP_DIR="$(node -e 'console.log(require("node:os").tmpdir())')"
echo "Removing leftover test databases in ${TMP_DIR}..."
removed=0
for f in "${TMP_DIR}"/basis-test-*.db "${TMP_DIR}"/basis-test-*.db-wal "${TMP_DIR}"/basis-test-*.db-shm; do
  if [ -e "$f" ]; then
    rm -f "$f"
    removed=$((removed + 1))
  fi
done
echo "Removed ${removed} leftover test database file(s)."

echo "Cleanup complete."
