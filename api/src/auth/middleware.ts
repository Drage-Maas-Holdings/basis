import { createMiddleware } from "hono/factory";
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

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user as User);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});
