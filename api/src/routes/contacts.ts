import { Hono } from "hono";
import { eq, like, or, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db/client.js";
import { contacts } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const contactsRoutes = new Hono();

contactsRoutes.use("/contacts/*", authMiddleware);
contactsRoutes.use("/contacts", authMiddleware);

contactsRoutes.post("/contacts", async (c) => {
  const body = await c.req.json();
  const { name, email, phone, company, notes } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return c.json({ error: "Name is required" }, 400);
  }

  const user = c.get("user");
  const now = Date.now();
  const id = createId();

  const [contact] = await db
    .insert(contacts)
    .values({
      id,
      name: name.trim(),
      email: email ?? null,
      phone: phone ?? null,
      company: company ?? null,
      notes: notes ?? null,
      ownerId: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json({ data: contact }, 201);
});

contactsRoutes.get("/contacts", async (c) => {
  const { search, company, limit: limitRaw, offset: offsetRaw } = c.req.query();

  const limit = Math.min(Math.max(parseInt(limitRaw || "25", 10) || 25, 1), 100);
  const offset = Math.max(parseInt(offsetRaw || "0", 10) || 0, 0);

  const conditions = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(contacts.name, pattern),
        like(contacts.email, pattern),
        like(contacts.company, pattern),
      ),
    );
  }

  if (company) {
    conditions.push(eq(contacts.company, company));
  }

  const where = conditions.length > 0 ? sql`${conditions[0]}` : undefined;

  let query = db.select().from(contacts).$dynamic();

  if (where) {
    query = query.where(where);
  }

  const data = await query.limit(limit).offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(contacts)
    .where(where);

  return c.json({
    data,
    pagination: { limit, offset, total },
  });
});

contactsRoutes.get("/contacts/:id", async (c) => {
  const { id } = c.req.param();

  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);

  if (!contact) {
    return c.json({ error: "Contact not found" }, 404);
  }

  return c.json({ data: contact });
});

contactsRoutes.put("/contacts/:id", async (c) => {
  const { id } = c.req.param();

  const [existing] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Contact not found" }, 404);
  }

  const user = c.get("user");
  if (existing.ownerId !== user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json();
  const { name, email, phone, company, notes } = body;

  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (company !== undefined) updates.company = company;
  if (notes !== undefined) updates.notes = notes;

  const [updated] = await db
    .update(contacts)
    .set(updates)
    .where(eq(contacts.id, id))
    .returning();

  return c.json({ data: updated });
});

contactsRoutes.delete("/contacts/:id", async (c) => {
  const { id } = c.req.param();

  const [existing] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Contact not found" }, 404);
  }

  const user = c.get("user");
  if (existing.ownerId !== user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db.delete(contacts).where(eq(contacts.id, id));

  return c.body(null, 204);
});

export default contactsRoutes;
