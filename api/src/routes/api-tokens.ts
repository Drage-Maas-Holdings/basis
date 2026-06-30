import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { auth } from "../auth/config.js";
import { authMiddleware } from "../auth/middleware.js";
import { db } from "../db/client.js";
import { apikey } from "../db/schema.js";

const apiTokensRoutes = new Hono();

apiTokensRoutes.use("/api-tokens/*", authMiddleware);
apiTokensRoutes.use("/api-tokens", authMiddleware);

apiTokensRoutes.post("/api-tokens", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ error: "Session required to create tokens" }, 403);
  }

  const body = await c.req.json();
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

apiTokensRoutes.get("/api-tokens", async (c) => {
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

apiTokensRoutes.delete("/api-tokens/:id", async (c) => {
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