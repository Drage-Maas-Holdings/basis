import { createRoute, z, OpenAPIHono } from "@hono/zod-openapi";
import { eq, lt, and, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "../db/client.js";
import { tasks, contacts, deals } from "../db/schema.js";
import { authMiddleware } from "../auth/middleware.js";

const tasksRoutes = new OpenAPIHono();

tasksRoutes.use("/tasks/*", authMiddleware);
tasksRoutes.use("/tasks", authMiddleware);

const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

const TaskSchema = z
  .object({
    id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    title: z.string().openapi({ example: "Follow up" }),
    dueAt: z.number().nullable().openapi({ example: 1700000000000 }),
    completed: z.number().openapi({ example: 0 }),
    contactId: z.string().nullable().openapi({ example: "ckly1x7s2000001qexxx" }),
    dealId: z.string().nullable().openapi({ example: "ckly1x7s2000001qexxx" }),
    ownerId: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    createdAt: z.number().openapi({ example: 1700000000000 }),
    updatedAt: z.number().openapi({ example: 1700000000000 }),
  })
  .openapi("Task");

const PaginationSchema = z
  .object({
    limit: z.number().openapi({ example: 25 }),
    offset: z.number().openapi({ example: 0 }),
    total: z.number().openapi({ example: 42 }),
  })
  .openapi("Pagination");

const createTaskRoute = createRoute({
  method: "post",
  path: "/tasks",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().optional().openapi({ example: "Follow up" }),
            due_at: z.number().optional().openapi({ example: 1700000000000 }),
            contact_id: z.string().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
            deal_id: z.string().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ data: TaskSchema }),
        },
      },
      description: "Task created",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Missing title, invalid due_at, or invalid reference",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Tasks"],
  operationId: "createTask",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const listTasksRoute = createRoute({
  method: "get",
  path: "/tasks",
  request: {
    query: z.object({
      completed: z.enum(["true", "false"]).optional().openapi({ example: "true" }),
      owner_id: z.string().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
      contact_id: z.string().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
      deal_id: z.string().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
      overdue: z.enum(["true"]).optional().openapi({ example: "true" }),
      limit: z.string().optional().openapi({ example: "25" }),
      offset: z.string().optional().openapi({ example: "0" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(TaskSchema),
            pagination: PaginationSchema,
          }),
        },
      },
      description: "Paginated list of tasks",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["Tasks"],
  operationId: "listTasks",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const getTaskRoute = createRoute({
  method: "get",
  path: "/tasks/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: TaskSchema }),
        },
      },
      description: "Task details",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Task not found",
    },
  },
  tags: ["Tasks"],
  operationId: "getTask",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const updateTaskRoute = createRoute({
  method: "put",
  path: "/tasks/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().optional().openapi({ example: "Updated task" }),
            due_at: z.number().optional().openapi({ example: 1700000000000 }),
            completed: z.boolean().optional().openapi({ example: true }),
            contact_id: z.string().nullable().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
            deal_id: z.string().nullable().optional().openapi({ example: "ckly1x7s2000001qexxx" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: TaskSchema }),
        },
      },
      description: "Task updated",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid due_at or reference",
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
      description: "Task not found",
    },
  },
  tags: ["Tasks"],
  operationId: "updateTask",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const deleteTaskRoute = createRoute({
  method: "delete",
  path: "/tasks/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
  },
  responses: {
    204: { description: "Task deleted" },
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
      description: "Task not found",
    },
  },
  tags: ["Tasks"],
  operationId: "deleteTask",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

tasksRoutes.openapi(createTaskRoute, async (c) => {
  const body = c.req.valid("json");
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

tasksRoutes.openapi(listTasksRoute, async (c) => {
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

tasksRoutes.openapi(getTaskRoute, async (c) => {
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

tasksRoutes.openapi(updateTaskRoute, async (c) => {
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

  const body = c.req.valid("json");
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

tasksRoutes.openapi(deleteTaskRoute, async (c) => {
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