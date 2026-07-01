import { createRoute, z, OpenAPIHono } from "@hono/zod-openapi";
import { eq, like, or, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db/client.js";
import { contacts } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const contactsRoutes = new OpenAPIHono();

contactsRoutes.use("/contacts/*", authMiddleware);
contactsRoutes.use("/contacts", authMiddleware);

const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

const ContactSchema = z
  .object({
    id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    name: z.string().openapi({ example: "Jane Doe" }),
    email: z.string().nullable().openapi({ example: "jane@example.com" }),
    phone: z.string().nullable().openapi({ example: "555-0100" }),
    company: z.string().nullable().openapi({ example: "Acme Corp" }),
    notes: z.string().nullable().openapi({ example: "Met at conference" }),
    ownerId: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    createdAt: z.number().openapi({ example: 1700000000000 }),
    updatedAt: z.number().openapi({ example: 1700000000000 }),
  })
  .openapi("Contact");

const PaginationSchema = z
  .object({
    limit: z.number().openapi({ example: 25 }),
    offset: z.number().openapi({ example: 0 }),
    total: z.number().openapi({ example: 42 }),
  })
  .openapi("Pagination");

const createContactRoute = createRoute({
  method: "post",
  path: "/contacts",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().optional().openapi({ example: "Jane Doe" }),
            email: z.string().optional().openapi({ example: "jane@example.com" }),
            phone: z.string().optional().openapi({ example: "555-0100" }),
            company: z.string().optional().openapi({ example: "Acme Corp" }),
            notes: z.string().optional().openapi({ example: "Met at conference" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ data: ContactSchema }),
        },
      },
      description: "Contact created",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Missing required fields",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Contacts"],
  operationId: "createContact",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const listContactsRoute = createRoute({
  method: "get",
  path: "/contacts",
  request: {
    query: z.object({
      search: z.string().optional().openapi({ example: "Jane" }),
      company: z.string().optional().openapi({ example: "Acme" }),
      limit: z.string().optional().openapi({ example: "25" }),
      offset: z.string().optional().openapi({ example: "0" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(ContactSchema),
            pagination: PaginationSchema,
          }),
        },
      },
      description: "Paginated list of contacts",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Contacts"],
  operationId: "listContacts",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const getContactRoute = createRoute({
  method: "get",
  path: "/contacts/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: ContactSchema }),
        },
      },
      description: "Contact details",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Contact not found",
    },
  },
  tags: ["Contacts"],
  operationId: "getContact",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const updateContactRoute = createRoute({
  method: "put",
  path: "/contacts/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().optional().openapi({ example: "Jane Doe" }),
            email: z.string().nullable().optional().openapi({ example: "jane@example.com" }),
            phone: z.string().nullable().optional().openapi({ example: "555-0100" }),
            company: z.string().nullable().optional().openapi({ example: "Acme Corp" }),
            notes: z.string().nullable().optional().openapi({ example: "Updated notes" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: ContactSchema }),
        },
      },
      description: "Contact updated",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid request body",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    403: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Forbidden (not owner)",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Contact not found",
    },
  },
  tags: ["Contacts"],
  operationId: "updateContact",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const deleteContactRoute = createRoute({
  method: "delete",
  path: "/contacts/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
  },
  responses: {
    204: { description: "Contact deleted" },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    403: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Forbidden (not owner)",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Contact not found",
    },
  },
  tags: ["Contacts"],
  operationId: "deleteContact",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

contactsRoutes.openapi(createContactRoute, async (c) => {
  const body = c.req.valid("json");
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

contactsRoutes.openapi(listContactsRoute, async (c) => {
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

contactsRoutes.openapi(getContactRoute, async (c) => {
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

contactsRoutes.openapi(updateContactRoute, async (c) => {
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

  const body = c.req.valid("json");
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

contactsRoutes.openapi(deleteContactRoute, async (c) => {
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