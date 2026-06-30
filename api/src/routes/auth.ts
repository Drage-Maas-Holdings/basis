import { Hono } from "hono";
import { auth } from "../auth/config.js";
import { authMiddleware } from "../auth/middleware.js";

const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/\/register$/, "/sign-up/email");
  const request = new Request(url.toString(), {
    method: "POST",
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });
  const response = await auth.handler(request);
  // Match on Better Auth's stable error code, not the message text.
  // The code "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" is defined in
  // @better-auth/core/dist/error/codes.mjs and thrown by the sign-up
  // endpoint (better-auth/dist/api/routes/sign-up.mjs) when the email
  // already exists. If Better Auth renames or removes this code, the
  // match will fail closed (falling through to the original response)
  // and the code should be updated to match.
  if (response.status === 422) {
    const cloned = response.clone();
    const body = await cloned.json().catch(() => null);
    if (body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
      return c.json(
        { message: "Invalid request", code: "VALIDATION_ERROR" },
        400,
      );
    }
  }
  return response;
});

authRoutes.post("/login", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/\/login$/, "/sign-in/email");
  const request = new Request(url.toString(), {
    method: "POST",
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });
  return auth.handler(request);
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json({ id: user.id, email: user.email, name: user.name });
});

authRoutes.on(["POST", "GET"], "/*", (c) => auth.handler(c.req.raw));

export default authRoutes;
