import { createRoute, z, OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "../auth/config.js";
import { authMiddleware } from "../auth/middleware.js";

const authRoutes = new OpenAPIHono();

const UserSchema = z
  .object({
    id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    email: z.string().openapi({ example: "user@example.com" }),
    name: z.string().openapi({ example: "Alice" }),
    emailVerified: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    image: z.string().nullable().optional(),
  })
  .openapi("AuthUser");

const SessionSchema = z
  .object({
    id: z.string(),
    expiresAt: z.number(),
    token: z.string(),
  })
  .openapi("AuthSession");

const RegisterErrorSchema = z
  .object({
    message: z.string().openapi({ example: "Invalid request" }),
    code: z.string().openapi({ example: "VALIDATION_ERROR" }),
  })
  .openapi("RegisterError");

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().optional().openapi({ example: "user@example.com" }),
            password: z.string().optional().openapi({ example: "password123" }),
            name: z.string().optional().openapi({ example: "Alice" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            user: UserSchema,
            session: SessionSchema,
          }),
        },
      },
      description: "User registered successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: RegisterErrorSchema,
        },
      },
      description: "Invalid request or email already in use",
    },
  },
  tags: ["Auth"],
  operationId: "authRegister",
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().optional().openapi({ example: "user@example.com" }),
            password: z.string().optional().openapi({ example: "password123" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            user: UserSchema,
            session: SessionSchema,
          }),
        },
      },
      description: "User logged in successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().optional(),
          }),
        },
      },
      description: "Invalid credentials",
    },
  },
  tags: ["Auth"],
  operationId: "authLogin",
});

const MeResponseSchema = z
  .object({
    id: z.string().openapi({ example: "ckly1x7s2000001qexxx" }),
    email: z.string().openapi({ example: "user@example.com" }),
    name: z.string().openapi({ example: "Alice" }),
  })
  .openapi("MeResponse");

const meRoute = createRoute({
  method: "get",
  path: "/me",
  middleware: [authMiddleware] as const,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MeResponseSchema,
        },
      },
      description: "Current user identity",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Unauthorized",
    },
  },
  tags: ["Auth"],
  operationId: "authMe",
  security: [{ SessionCookie: [] }, { Bearer: [] }],
});

authRoutes.openapi(registerRoute, async (c) => {
  const body = c.req.valid("json");
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/\/register$/, "/sign-up/email");
  const request = new Request(url.toString(), {
    method: "POST",
    headers: c.req.raw.headers,
    body: JSON.stringify(body),
  });
  const response = await auth.handler(request);
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

authRoutes.openapi(loginRoute, async (c) => {
  const body = c.req.valid("json");
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/\/login$/, "/sign-in/email");
  const request = new Request(url.toString(), {
    method: "POST",
    headers: c.req.raw.headers,
    body: JSON.stringify(body),
  });
  return auth.handler(request);
});

authRoutes.openapi(meRoute, async (c) => {
  const user = c.get("user");
  return c.json({ id: user.id, email: user.email, name: user.name }, 200);
});

authRoutes.on(["POST", "GET"], "/*", (c) => auth.handler(c.req.raw));

export default authRoutes;