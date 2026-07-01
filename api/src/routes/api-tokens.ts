import { createRoute, z, OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { auth } from "../auth/config.js";
import { authMiddleware } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { apikey } from "../db/schema.js";

const apiTokensRoutes = new OpenAPIHono();

apiTokensRoutes.use("/api-tokens/*", authMiddleware);
apiTokensRoutes.use("/api-tokens", authMiddleware);

const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

const ApiTokenSchema = z
  .object({
    id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    name: z.string().openapi({ example: "ci-token" }),
    key: z.string().optional().openapi({ example: "basis_xxxxxxxxxxxx" }),
    prefix: z.string().optional(),
    start: z.string().optional(),
    createdAt: z.number().optional(),
    lastRequest: z.number().nullable().optional(),
    enabled: z.boolean().optional(),
  })
  .openapi("ApiToken");

const ListedTokenSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    prefix: z.string().nullable(),
    start: z.string().nullable(),
    createdAt: z.number().nullable(),
    lastRequest: z.number().nullable(),
    enabled: z.boolean().nullable(),
  })
  .openapi("ListedToken");

const createTokenRoute = createRoute({
  method: "post",
  path: "/api-tokens",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
name: z.string().optional().openapi({ example: "ci-token" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ data: ApiTokenSchema }),
        },
      },
      description: "API token created",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Missing name",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
    403: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Session required to create tokens (bearer token rejected)",
    },
  },
  tags: ["API Tokens"],
  operationId: "createApiToken",
  security: [{ SessionCookie: [] }],
});

const listTokensRoute = createRoute({
  method: "get",
  path: "/api-tokens",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.array(ListedTokenSchema) }),
        },
      },
      description: "List of API tokens for the current user",
    },
    401: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Unauthorized",
    },
  },
  tags: ["API Tokens"],
  operationId: "listApiTokens",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

const deleteTokenRoute = createRoute({
  method: "delete",
  path: "/api-tokens/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    }),
  },
  responses: {
    204: { description: "Token deleted" },
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
      description: "Token not found",
    },
  },
  tags: ["API Tokens"],
  operationId: "deleteApiToken",
  security: [{ Bearer: [] }, { SessionCookie: [] }],
});

apiTokensRoutes.openapi(createTokenRoute, async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ error: "Session required to create tokens" }, 403);
  }

  const body = c.req.valid("json");
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return c.json({ error: "Name is required" }, 400);
  }

  const result = await auth.api.createApiKey({
    body: {
      name: name.trim(),
      userId: session.user.id,
    },
  });

  return c.json({ data: result }, 201);
});

apiTokensRoutes.openapi(listTokensRoute, async (c) => {
  const user = c.get("user");

  const keys = await db
    .select({
      id: apikey.id,
      name: apikey.name,
      prefix: apikey.prefix,
      start: apikey.start,
      createdAt: apikey.createdAt,
      lastRequest: apikey.lastRequest,
      enabled: apikey.enabled,
    })
    .from(apikey)
    .where(eq(apikey.referenceId, user.id));

  return c.json({ data: keys });
});

apiTokensRoutes.openapi(deleteTokenRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.param();

  const [existing] = await db
    .select()
    .from(apikey)
    .where(eq(apikey.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Token not found" }, 404);
  }

  if (existing.referenceId !== user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db.delete(apikey).where(eq(apikey.id, id));

  return c.body(null, 204);
});

export default apiTokensRoutes;