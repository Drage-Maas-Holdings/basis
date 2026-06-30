import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client.js";
import * as schema from "../db/schema.js";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET environment variable is not set. Generate one with: openssl rand -base64 32"
  );
}

const sessionExpirySeconds = parseInt(
  process.env.SESSION_EXPIRY_SECONDS || "604800",
  10
);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: sessionExpirySeconds,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

export type Session = typeof auth.$Infer.Session;
