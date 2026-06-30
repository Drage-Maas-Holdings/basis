import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { auth } from "./config.js";

type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
};

declare module "hono" {
  interface ContextVariableMap {
    user: User;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session) {
      c.set("user", session.user as User);
      return await next();
    }

    const authHeader = c.req.raw.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.slice(7);
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const result = await auth.api.verifyApiKey({
      body: { key: token },
    });

    if (!result.valid || !result.key) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, result.key.referenceId))
      .limit(1);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", user as User);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});
