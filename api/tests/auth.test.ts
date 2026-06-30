import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { BASE_URL, registerUser } from "./helpers.js";

describe("POST /auth/register", () => {
  it("happy path: creates a user and returns a session cookie", async () => {
    const email = `${randomUUID()}@example.com`;
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123", name: "Alice" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/better-auth\.session_token=/);
    const body = await res.json();
    expect(body.user.email).toBe(email);
    expect(body.user).toHaveProperty("id");
  });

  it("validation: missing required fields returns 400", async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `${randomUUID()}@example.com` }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects registering the same email twice with 400", async () => {
    const email = `${randomUUID()}@example.com`;
    const payload = { email, password: "password123", name: "Bob" };

    const first = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(first.status).toBe(200);

    const second = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(second.status).toBe(400);
    const body = await second.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /auth/login", () => {
  it("happy path: valid credentials return a session cookie", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "password123" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/better-auth\.session_token=/);
  });

  it("rejects invalid credentials with 401", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "wrong-password" }),
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/auth/me`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("happy path: returns the authenticated user's identity", async () => {
    const user = await registerUser("Carol");
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Cookie: user.cookie },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: user.id, email: user.email, name: "Carol" });
  });
});
