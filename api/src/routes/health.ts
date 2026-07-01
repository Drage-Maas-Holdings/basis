import { createRoute, z, OpenAPIHono } from "@hono/zod-openapi";

const health = new OpenAPIHono();

const route = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ status: z.string().openapi({ example: "ok" }) }),
        },
      },
      description: "Server health status",
    },
  },
  tags: ["Health"],
  operationId: "healthCheck",
});

health.openapi(route, (c) => {
  return c.json({ status: "ok" }, 200);
});

export default health;