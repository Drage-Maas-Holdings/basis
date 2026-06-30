import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { BASE_URL, registerUser, createApiToken, jsonHeaders } from "./helpers.js";

describe("POST /api-tokens", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });
    expect(res.status).toBe(401);
  });

  it("happy path: session-authenticated request creates a token", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/api-tokens`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ name: "ci-token" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.name).toBe("ci-token");
    expect(body.data.key).toMatch(/^basis_/);
  });

  it("validation: missing name returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/api-tokens`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Name is required" });
  });

  it("token auth: POST with a bearer token instead of a session is rejected", async () => {
    const user = await registerUser();
    const token = await createApiToken(user);

    const res = await fetch(`${BASE_URL}/api-tokens`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "should-be-rejected" }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "Session required to create tokens" });
  });
});

describe("GET /api-tokens", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api-tokens`);
    expect(res.status).toBe(401);
  });

  it("happy path: lists the caller's tokens", async () => {
    const user = await registerUser();
    await createApiToken(user, "list-me");

    const res = await fetch(`${BASE_URL}/api-tokens`, {
      headers: jsonHeaders(user),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((t: { name: string }) => t.name === "list-me")).toBe(true);
  });

  it("a bearer token can authenticate a GET", async () => {
    const user = await registerUser();
    const token = await createApiToken(user);

    const res = await fetch(`${BASE_URL}/api-tokens`, {
      headers: { Authorization: `Bearer ${token.key}` },
    });

    expect(res.status).toBe(200);
  });
});

describe("DELETE /api-tokens/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api-tokens/${randomUUID()}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  it("not found: returns 404 for a non-existent token", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/api-tokens/${randomUUID()}`, {
      method: "DELETE",
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Token not found" });
  });

  it("ownership: non-owner delete returns 403", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const token = await createApiToken(owner);

    const res = await fetch(`${BASE_URL}/api-tokens/${token.id}`, {
      method: "DELETE",
      headers: jsonHeaders(other),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("happy path: owner revokes their token, then it 404s", async () => {
    const user = await registerUser();
    const token = await createApiToken(user);

    const del = await fetch(`${BASE_URL}/api-tokens/${token.id}`, {
      method: "DELETE",
      headers: jsonHeaders(user),
    });
    expect(del.status).toBe(204);

    const del2 = await fetch(`${BASE_URL}/api-tokens/${token.id}`, {
      method: "DELETE",
      headers: jsonHeaders(user),
    });
    expect(del2.status).toBe(404);
  });
});
