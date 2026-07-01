import "dotenv/config";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import health from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import contactsRoutes from "./routes/contacts.js";
import dealsRoutes from "./routes/deals.js";
import tasksRoutes from "./routes/tasks.js";
import interactionLogsRoutes from "./routes/interaction-logs.js";
import pipelineRoutes from "./routes/pipeline.js";
import reportsRoutes from "./routes/reports.js";
import apiTokensRoutes from "./routes/api-tokens.js";
import "./db/client.js";

const app = new OpenAPIHono();

app.use("*", logger());

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

app.openAPIRegistry.registerComponent("securitySchemes", "SessionCookie", {
  type: "apiKey",
  in: "cookie",
  name: "better-auth.session_token",
});

app.doc31("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Basis CRM API",
    version: "0.1.0",
    description:
      "A lean, self-hosted CRM API for managing contacts, deals, tasks, and interaction logs.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local development" }],
});

app.route("/", health);
app.route("/auth", authRoutes);
app.route("/", contactsRoutes);
app.route("/", dealsRoutes);
app.route("/", tasksRoutes);
app.route("/", interactionLogsRoutes);
app.route("/", pipelineRoutes);
app.route("/", reportsRoutes);
app.route("/", apiTokensRoutes);

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`Starting server on port ${port}...`);

serve({ fetch: app.fetch, port });