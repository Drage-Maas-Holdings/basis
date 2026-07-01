import { createRoute, z, OpenAPIHono } from "@hono/zod-openapi";
import { eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db/client.js";
import { deals, contacts } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const VALID_STAGES = ["new", "qualified", "won", "lost"] as const;

const dealsRoutes = new OpenAPIHono();

dealsRoutes.use("/deals/*", authMiddleware);
dealsRoutes.use("/deals", authMiddleware);

const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

const StageEnum = z.enum(VALID_STAGES).openapi({ example: "new" });

const DealSchema = z
  .object({
    id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    title: z.string().openapi({ example: "Big Deal" }),
    stage: StageEnum,
    value: z.number().nullable().openapi({ example: 1000 }),
    contactId: z.string().nullable().openapi({ example: "ckly1x7s2000001qexxx" }),
    ownerId: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    stageChangedAt: z.number().nullable().openapi({ example: 1700000000000 }),
    createdAt: z.number().openapi({ example: 1700000000000 }),
    updatedAt: z.number().openapi({ example: 1700000000000 }),
  })
  .openapi("Deal");

const ContactRefSchema = z
  .object({
    id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    name: z.string().openapi({ example: "Jane Doe" }),
    email: z.string().openapi({ example: "jane@example.com" }),
    company: z.string().nullable().openapi({ example: "Acme Corp" }),
  })
  .openapi("ContactRef");

const DealWithContactSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    stage: StageEnum,
    value: z.number().nullable(),
    contactId: z.string().nullable(),
    ownerId: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
    contact: ContactRefSchema.nullable(),
  })
  .openapi("DealWithContact");

const PaginationSchema = z
  .object({
    limit: z.number().openapi({ example: 25 }),
    offset: z.number().openapi({ example: 0 }),
    total: z.number().openapi({ example: 42 }),
  })
  .openapi("Pagination");

const createDealRoute = createRoute({
  method: "post",
  path: "/deals",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().optional().openapi({ example: "Big Deal" }),
            stage: z.string().optional().openapi({ enum: ["new", "qualified", "won", "lost"], example: "new", description: "Deal stage" }),
            value: z.number().optional().openapi({ example: 1000 }),
            contact_id: z.string().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ data: DealSchema }),
        },
      },
      description: "Deal created",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Missing title, invalid stage, or invalid contact",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Deals"],
  operationId: "createDeal",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const listDealsRoute = createRoute({
  method: "get",
  path: "/deals",
  request: {
    query: z.object({
      stage: z.enum(VALID_STAGES).optional().openapi({ example: "won" }),
      owner_id: z.string().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
      limit: z.string().optional().openapi({ example: "25" }),
      offset: z.string().optional().openapi({ example: "0" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(DealSchema),
            pagination: PaginationSchema,
          }),
        },
      },
      description: "Paginated list of deals",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Deals"],
  operationId: "listDeals",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const getDealRoute = createRoute({
  method: "get",
  path: "/deals/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: DealWithContactSchema }),
        },
      },
      description: "Deal details with optional contact info",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Deal not found",
    },
  },
  tags: ["Deals"],
  operationId: "getDeal",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const updateDealRoute = createRoute({
  method: "put",
  path: "/deals/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().optional().openapi({ example: "Updated Deal" }),
            stage: z.string().optional().openapi({ enum: ["new", "qualified", "won", "lost"], example: "won", description: "Deal stage" }),
            value: z.number().optional().openapi({ example: 2000 }),
            contact_id: z.string().nullable().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: DealSchema }),
        },
      },
      description: "Deal updated",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid stage or contact",
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
      description: "Deal not found",
    },
  },
  tags: ["Deals"],
  operationId: "updateDeal",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const deleteDealRoute = createRoute({
  method: "delete",
  path: "/deals/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
  },
  responses: {
    204: { description: "Deal deleted" },
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
      description: "Deal not found",
    },
  },
  tags: ["Deals"],
  operationId: "deleteDeal",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

dealsRoutes.openapi(createDealRoute, async (c) => {
  const body = c.req.valid("json");
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
      stageChangedAt: resolvedStage !== "new" ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json({ data: deal }, 201);
});

dealsRoutes.openapi(listDealsRoute, async (c) => {
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

dealsRoutes.openapi(getDealRoute, async (c) => {
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

dealsRoutes.openapi(updateDealRoute, async (c) => {
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

  const body = c.req.valid("json");
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
  if (stage !== undefined) {
    if (stage !== existing.stage) {
      updates.stageChangedAt = Date.now();
    }
    updates.stage = stage;
  }
  if (value !== undefined) updates.value = value;
  if (contact_id !== undefined) updates.contactId = contact_id;

  const [updated] = await db
    .update(deals)
    .set(updates)
    .where(eq(deals.id, id))
    .returning();

  return c.json({ data: updated });
});

dealsRoutes.openapi(deleteDealRoute, async (c) => {
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