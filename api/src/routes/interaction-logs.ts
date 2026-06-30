import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db/client.js";
import { interactionLogs, contacts, deals } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const VALID_TYPES = ["email", "call", "meeting", "note"] as const;

const interactionLogsRoutes = new Hono();

interactionLogsRoutes.use("/interaction-logs/*", authMiddleware);
interactionLogsRoutes.use("/interaction-logs", authMiddleware);

interactionLogsRoutes.post("/interaction-logs", async (c) => {
  const body = await c.req.json();
  const { type, body: logBody, contact_id, deal_id } = body;

  if (!type || typeof type !== "string" || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    return c.json({ error: "Invalid type" }, 400);
  }

  if (!logBody || typeof logBody !== "string" || logBody.trim().length === 0) {
    return c.json({ error: "Body is required" }, 400);
  }

  if (!contact_id && !deal_id) {
    return c.json({ error: "At least one of contact_id or deal_id is required" }, 400);
  }

  if (contact_id !== undefined && contact_id !== null) {
    if (typeof contact_id !== "string") {
      return c.json({ error: "Invalid contact_id" }, 400);
    }
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contact_id))
      .limit(1);
    if (!contact) {
      return c.json({ error: "Contact not found" }, 400);
    }
  }

  if (deal_id !== undefined && deal_id !== null) {
    if (typeof deal_id !== "string") {
      return c.json({ error: "Invalid deal_id" }, 400);
    }
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, deal_id))
      .limit(1);
    if (!deal) {
      return c.json({ error: "Deal not found" }, 400);
    }
  }

  const user = c.get("user");
  const now = Date.now();
  const id = createId();

  const [log] = await db
    .insert(interactionLogs)
    .values({
      id,
      type,
      body: logBody.trim(),
      contactId: contact_id ?? null,
      dealId: deal_id ?? null,
      loggedBy: user.id,
      createdAt: now,
    })
    .returning();

  return c.json({ data: log }, 201);
});

interactionLogsRoutes.get("/interaction-logs", async (c) => {
  const {
    contact_id,
    deal_id,
    type,
    logged_by,
    limit: limitRaw,
    offset: offsetRaw,
  } = c.req.query();

  const limit = Math.min(Math.max(parseInt(limitRaw || "25", 10) || 25, 1), 100);
  const offset = Math.max(parseInt(offsetRaw || "0", 10) || 0, 0);

  const conditions = [];

  if (contact_id) {
    conditions.push(eq(interactionLogs.contactId, contact_id));
  }

  if (deal_id) {
    conditions.push(eq(interactionLogs.dealId, deal_id));
  }

  if (type) {
    conditions.push(eq(interactionLogs.type, type));
  }

  if (logged_by) {
    conditions.push(eq(interactionLogs.loggedBy, logged_by));
  }

  const where = conditions.length > 0
    ? conditions.length === 1
      ? conditions[0]
      : and(...conditions)
    : undefined;

  let query = db.select().from(interactionLogs).$dynamic();

  if (where) {
    query = query.where(where);
  }

  const data = await query
    .orderBy(sql`created_at desc`)
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(interactionLogs)
    .where(where);

  return c.json({
    data,
    pagination: { limit, offset, total },
  });
});

interactionLogsRoutes.get("/interaction-logs/:id", async (c) => {
  const { id } = c.req.param();

  const [log] = await db
    .select()
    .from(interactionLogs)
    .where(eq(interactionLogs.id, id))
    .limit(1);

  if (!log) {
    return c.json({ error: "Log entry not found" }, 404);
  }

  return c.json({ data: log });
});

export default interactionLogsRoutes;
