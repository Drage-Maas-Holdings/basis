import "dotenv/config";
import { Hono } from "hono";
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
import "./db/client.js";

const app = new Hono();

app.use("*", logger());
app.route("/", health);
app.route("/auth", authRoutes);
app.route("/", contactsRoutes);
app.route("/", dealsRoutes);
app.route("/", tasksRoutes);
app.route("/", interactionLogsRoutes);
app.route("/", pipelineRoutes);
app.route("/", reportsRoutes);

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`Starting server on port ${port}...`);

serve({ fetch: app.fetch, port });
