import { createRoute, z, OpenAPIHono } from "@hono/zod-openapi";
import { eq, and, gte, lte, gt, isNotNull, inArray, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { contacts, deals, tasks } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const reportsRoutes = new OpenAPIHono();

reportsRoutes.use("/reports/*", authMiddleware);

const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

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

const DateRangeQuery = z.object({
  from: z.string().optional().openapi({ example: "1700000000000" }),
  to: z.string().optional().openapi({ example: "1700086400000" }),
});

const leadsAddedRoute = createRoute({
  method: "get",
  path: "/reports/leads-added",
  request: { query: DateRangeQuery },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            count: z.number().openapi({ example: 5 }),
            from: z.number().openapi({ example: 1700000000000 }),
            to: z.number().openapi({ example: 1700086400000 }),
          }),
        },
      },
      description: "Count of contacts created in the date range",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid date range",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Reports"],
  operationId: "getLeadsAdded",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const dealsSummaryRoute = createRoute({
  method: "get",
  path: "/reports/deals-summary",
  request: { query: DateRangeQuery },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            won: z.object({ count: z.number(), total: z.number() }),
            lost: z.object({ count: z.number(), total: z.number() }),
            from: z.number(),
            to: z.number(),
          }),
        },
      },
      description: "Won/lost deal summary in the date range",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid date range",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Reports"],
  operationId: "getDealsSummary",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const upcomingTasksRoute = createRoute({
  method: "get",
  path: "/reports/upcoming-tasks",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            count: z.number().openapi({ example: 3 }),
          }),
        },
      },
      description: "Count of incomplete tasks with future due dates",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Reports"],
  operationId: "getUpcomingTasks",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

reportsRoutes.openapi(leadsAddedRoute, async (c) => {
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

reportsRoutes.openapi(dealsSummaryRoute, async (c) => {
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

reportsRoutes.openapi(upcomingTasksRoute, async (c) => {
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