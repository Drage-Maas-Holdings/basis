import { Hono } from "hono";
import { APIError } from "better-auth";
import { auth } from "../auth/config.js";
import { authMiddleware } from "../auth/middleware.js";

const authRoutes = new Hono();

function statusCode(error: unknown): number {
  if (error instanceof APIError) {
    const s = typeof error.status === "number" ? error.status : 400;
    if (s >= 400 && s < 600) return s;
  }
  return 400;
}

authRoutes.post("/register", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
      headers: c.req.raw.headers,
    });
    return c.json({
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error) {
    const status = statusCode(error);
    const message =
      error instanceof APIError
        ? error.message
        : "Invalid request";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
});

authRoutes.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: c.req.raw.headers,
    });
    return c.json({
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error) {
    const status = statusCode(error);
    const message =
      error instanceof APIError
        ? error.message
        : "Invalid request";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json({ id: user.id, email: user.email, name: user.name });
});

export default authRoutes;
