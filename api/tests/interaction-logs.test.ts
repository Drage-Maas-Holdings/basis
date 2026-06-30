import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import {
  BASE_URL,
  registerUser,
  createContact,
  jsonHeaders,
} from "./helpers.js";

describe("POST /interaction-logs", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/interaction-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", body: "hi" }),
    });
    expect(res.status).toBe(401);
  });

  it("happy path: logs an interaction tied to a contact", async () => {
    const user = await registerUser();
    const contact = await createContact(user);

    const res = await fetch(`${BASE_URL}/interaction-logs`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({
        type: "call",
        body: "discussed pricing",
        contact_id: contact.id,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({
      type: "call",
      body: "discussed pricing",
      contactId: contact.id,
      loggedBy: user.id,
    });
  });

  it("validation: missing body returns 400", async () => {
    const user = await registerUser();
    const contact = await createContact(user);

    const res = await fetch(`${BASE_URL}/interaction-logs`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ type: "note", contact_id: contact.id }),
    });
    expect(res.status).toBe(400);
  });

  it("validation: invalid type returns 400", async () => {
    const user = await registerUser();
    const contact = await createContact(user);

    const res = await fetch(`${BASE_URL}/interaction-logs`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ type: "carrier-pigeon", body: "x", contact_id: contact.id }),
    });
    expect(res.status).toBe(400);
  });

  it("validation: missing both contact_id and deal_id returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/interaction-logs`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ type: "note", body: "no link" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      error: "At least one of contact_id or deal_id is required",
    });
  });

  it("validation: non-existent contact_id returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/interaction-logs`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ type: "note", body: "x", contact_id: randomUUID() }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /interaction-logs", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/interaction-logs`);
    expect(res.status).toBe(401);
  });

  it("happy path: returns a paginated list shape", async () => {
    const user = await registerUser();
    const contact = await createContact(user);
    await fetch(`${BASE_URL}/interaction-logs`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ type: "note", body: "x", contact_id: contact.id }),
    });

    const res = await fetch(`${BASE_URL}/interaction-logs`, {
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toHaveProperty("total");
  });
});

describe("GET /interaction-logs/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/interaction-logs/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("happy path: returns the requested log entry", async () => {
    const user = await registerUser();
    const contact = await createContact(user);
    const created = await fetch(`${BASE_URL}/interaction-logs`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ type: "note", body: "x", contact_id: contact.id }),
    }).then((r) => r.json());

    const res = await fetch(`${BASE_URL}/interaction-logs/${created.data.id}`, {
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(created.data.id);
  });

  it("not found: returns 404 for a non-existent log entry", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/interaction-logs/${randomUUID()}`, {
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Log entry not found" });
  });
});

// Note: interaction-logs is append-only — the API exposes no PUT/DELETE
// routes for it, so the ownership (403 on non-owner write) category from
// the coverage matrix does not apply here. See the reporting notes.
