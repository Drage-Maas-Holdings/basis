import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import health from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import "./db/client.js";

const app = new Hono();

app.use("*", logger());
app.route("/", health);
app.route("/auth", authRoutes);

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`Starting server on port ${port}...`);

serve({ fetch: app.fetch, port });
