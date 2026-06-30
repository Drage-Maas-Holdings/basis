import { Hono } from "hono";
import { eq, and, gte, lte, gt, isNotNull, inArray, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { contacts, deals, tasks } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const reportsRoutes = new Hono();

reportsRoutes.use("/reports/*", authMiddleware);

function parseDateRange(fromRaw: string | undefined, toRaw: string | undefined) {
  const serverNow = Date.now();
  const defaultFrom = serverNow - 30 * 24 * 60 * 60 * 1000;
  const defaultTo = serverNow;

  if (fromRaw !== undefined && (isNaN(Number(fromRaw)) || fromRaw.trim() === "")) {
    return { error: "Invalid from" as const };
  }
  if (toRaw !== undefined && (isNaN(Number(toRaw)) || toRaw.trim() === "")) {
    return { error: "Invalid to" as const };
  }

  const from = fromRaw !== undefined ? Number(fromRaw) : defaultFrom;
  const to = toRaw !== undefined ? Number(toRaw) : defaultTo;

  if (from > to) {
    return { error: "from must not be after to" as const };
  }

  return { from, to };
}

reportsRoutes.get("/reports/leads-added", async (c) => {
  const { from: fromRaw, to: toRaw } = c.req.query();

  const range = parseDateRange(fromRaw, toRaw);
  if ("error" in range) {
    return c.json({ error: range.error }, 400);
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(
      and(gte(contacts.createdAt, range.from), lte(contacts.createdAt, range.to)),
    );

  return c.json({ count: result.count, from: range.from, to: range.to });
});

reportsRoutes.get("/reports/deals-summary", async (c) => {
  const { from: fromRaw, to: toRaw } = c.req.query();

  const range = parseDateRange(fromRaw, toRaw);
  if ("error" in range) {
    return c.json({ error: range.error }, 400);
  }

  const rows = await db
    .select({
      stage: deals.stage,
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${deals.value}), 0)`,
    })
    .from(deals)
    .where(
      and(
        inArray(deals.stage, ["won", "lost"]),
        isNotNull(deals.stageChangedAt),
        gte(deals.stageChangedAt, range.from),
        lte(deals.stageChangedAt, range.to),
      ),
    )
    .groupBy(deals.stage);

  const wonRow = rows.find((r) => r.stage === "won");
  const lostRow = rows.find((r) => r.stage === "lost");

  return c.json({
    won: { count: wonRow?.count ?? 0, total: wonRow?.total ?? 0 },
    lost: { count: lostRow?.count ?? 0, total: lostRow?.total ?? 0 },
    from: range.from,
    to: range.to,
  });
});

reportsRoutes.get("/reports/upcoming-tasks", async (c) => {
  const now = Date.now();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(
      and(eq(tasks.completed, 0), isNotNull(tasks.dueAt), gt(tasks.dueAt, now)),
    );

  return c.json({ count: result.count });
});

export default reportsRoutes;