import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db/client.js";
import { deals, contacts } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const VALID_STAGES = ["new", "qualified", "won", "lost"] as const;

const dealsRoutes = new Hono();

dealsRoutes.use("/deals/*", authMiddleware);
dealsRoutes.use("/deals", authMiddleware);

dealsRoutes.post("/deals", async (c) => {
  const body = await c.req.json();
  const { title, stage, value, contact_id } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return c.json({ error: "Title is required" }, 400);
  }

  const resolvedStage = stage ?? "new";
  if (!VALID_STAGES.includes(resolvedStage)) {
    return c.json({ error: "Invalid stage" }, 400);
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

  const user = c.get("user");
  const now = Date.now();
  const id = createId();

  const [deal] = await db
    .insert(deals)
    .values({
      id,
      title: title.trim(),
      stage: resolvedStage,
      value: value ?? null,
      contactId: contact_id ?? null,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json({ data: deal }, 201);
});

dealsRoutes.get("/deals", async (c) => {
  const { stage, owner_id, limit: limitRaw, offset: offsetRaw } = c.req.query();

  const limit = Math.min(Math.max(parseInt(limitRaw || "25", 10) || 25, 1), 100);
  const offset = Math.max(parseInt(offsetRaw || "0", 10) || 0, 0);

  const conditions = [];

  if (stage) {
    conditions.push(eq(deals.stage, stage));
  }

  if (owner_id) {
    conditions.push(eq(deals.ownerId, owner_id));
  }

  const where = conditions.length > 0 ? sql`${conditions[0]}` : undefined;

  let query = db.select().from(deals).$dynamic();

  if (where) {
    query = query.where(where);
  }

  const data = await query.limit(limit).offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(deals)
    .where(where);

  return c.json({
    data,
    pagination: { limit, offset, total },
  });
});

dealsRoutes.get("/deals/:id", async (c) => {
  const { id } = c.req.param();

  const rows = await db
    .select({
      id: deals.id,
      title: deals.title,
      stage: deals.stage,
      value: deals.value,
      contactId: deals.contactId,
      ownerId: deals.ownerId,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      contactId2: contacts.id,
      contactName: contacts.name,
      contactEmail: contacts.email,
      contactCompany: contacts.company,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .where(eq(deals.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return c.json({ error: "Deal not found" }, 404);
  }

  const deal = {
    id: row.id,
    title: row.title,
    stage: row.stage,
    value: row.value,
    contactId: row.contactId,
    ownerId: row.ownerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    contact: row.contactId2
      ? {
          id: row.contactId2,
          name: row.contactName,
          email: row.contactEmail,
          company: row.contactCompany,
        }
      : null,
  };

  return c.json({ data: deal });
});

dealsRoutes.put("/deals/:id", async (c) => {
  const { id } = c.req.param();

  const [existing] = await db
    .select()
    .from(deals)
    .where(eq(deals.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Deal not found" }, 404);
  }

  const user = c.get("user");
  if (existing.ownerId !== user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json();
  const { title, stage, value, contact_id } = body;

  if (stage !== undefined && !VALID_STAGES.includes(stage)) {
    return c.json({ error: "Invalid stage" }, 400);
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

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (title !== undefined) updates.title = title;
  if (stage !== undefined) updates.stage = stage;
  if (value !== undefined) updates.value = value;
  if (contact_id !== undefined) updates.contactId = contact_id;

  const [updated] = await db
    .update(deals)
    .set(updates)
    .where(eq(deals.id, id))
    .returning();

  return c.json({ data: updated });
});

dealsRoutes.delete("/deals/:id", async (c) => {
  const { id } = c.req.param();

  const [existing] = await db
    .select()
    .from(deals)
    .where(eq(deals.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Deal not found" }, 404);
  }

  const user = c.get("user");
  if (existing.ownerId !== user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db.delete(deals).where(eq(deals.id, id));

  return c.body(null, 204);
});

export default dealsRoutes;
