import { Hono } from "hono";
import { eq, lt, and, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db/client.js";
import { tasks, contacts, deals } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const tasksRoutes = new Hono();

tasksRoutes.use("/tasks/*", authMiddleware);
tasksRoutes.use("/tasks", authMiddleware);

tasksRoutes.post("/tasks", async (c) => {
  const body = await c.req.json();
  const { title, due_at, contact_id, deal_id } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return c.json({ error: "Title is required" }, 400);
  }

  if (due_at !== undefined && due_at !== null) {
    if (typeof due_at !== "number" || !Number.isInteger(due_at) || due_at <= 0) {
      return c.json({ error: "Invalid due_at" }, 400);
    }
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

  const [task] = await db
    .insert(tasks)
    .values({
      id,
      title: title.trim(),
      dueAt: due_at ?? null,
      completed: 0,
      contactId: contact_id ?? null,
      dealId: deal_id ?? null,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json({ data: task }, 201);
});

tasksRoutes.get("/tasks", async (c) => {
  const {
    completed,
    owner_id,
    contact_id,
    deal_id,
    overdue,
    limit: limitRaw,
    offset: offsetRaw,
  } = c.req.query();

  const limit = Math.min(Math.max(parseInt(limitRaw || "25", 10) || 25, 1), 100);
  const offset = Math.max(parseInt(offsetRaw || "0", 10) || 0, 0);

  const conditions = [];

  if (completed !== undefined) {
    const val = completed === "true" ? 1 : 0;
    conditions.push(eq(tasks.completed, val));
  }

  if (owner_id) {
    conditions.push(eq(tasks.ownerId, owner_id));
  }

  if (contact_id) {
    conditions.push(eq(tasks.contactId, contact_id));
  }

  if (deal_id) {
    conditions.push(eq(tasks.dealId, deal_id));
  }

  if (overdue === "true") {
    const now = Date.now();
    conditions.push(
      and(lt(tasks.dueAt, now), eq(tasks.completed, 0)),
    );
  }

  const where =
    conditions.length > 0
      ? conditions.length === 1
        ? conditions[0]
        : and(...conditions)
      : undefined;

  let query = db.select().from(tasks).$dynamic();

  if (where) {
    query = query.where(where);
  }

  const data = await query.limit(limit).offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(tasks)
    .where(where);

  return c.json({
    data,
    pagination: { limit, offset, total },
  });
});

tasksRoutes.get("/tasks/:id", async (c) => {
  const { id } = c.req.param();

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1);

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json({ data: task });
});

tasksRoutes.put("/tasks/:id", async (c) => {
  const { id } = c.req.param();

  const [existing] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Task not found" }, 404);
  }

  const user = c.get("user");
  if (existing.ownerId !== user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json();
  const { title, due_at, completed, contact_id, deal_id } = body;

  if (due_at !== undefined && due_at !== null) {
    if (typeof due_at !== "number" || !Number.isInteger(due_at) || due_at <= 0) {
      return c.json({ error: "Invalid due_at" }, 400);
    }
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

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (title !== undefined) updates.title = title;
  if (due_at !== undefined) updates.dueAt = due_at;
  if (completed !== undefined) updates.completed = completed ? 1 : 0;
  if (contact_id !== undefined) updates.contactId = contact_id;
  if (deal_id !== undefined) updates.dealId = deal_id;

  const [updated] = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, id))
    .returning();

  return c.json({ data: updated });
});

tasksRoutes.delete("/tasks/:id", async (c) => {
  const { id } = c.req.param();

  const [existing] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Task not found" }, 404);
  }

  const user = c.get("user");
  if (existing.ownerId !== user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db.delete(tasks).where(eq(tasks.id, id));

  return c.body(null, 204);
});

export default tasksRoutes;
