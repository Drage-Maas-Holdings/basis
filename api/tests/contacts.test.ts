import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { BASE_URL, registerUser, createContact, jsonHeaders } from "./helpers.js";

describe("POST /contacts", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Nope" }),
    });
    expect(res.status).toBe(401);
  });

  it("happy path: creates a contact owned by the caller", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "555-0100",
        company: "Acme",
        notes: "met at conf",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "555-0100",
      company: "Acme",
      notes: "met at conf",
      ownerId: user.id,
    });
    expect(body.data).toHaveProperty("id");
  });

  it("validation: missing name returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ email: "no-name@example.com" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Name is required" });
  });
});

describe("GET /contacts", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/contacts`);
    expect(res.status).toBe(401);
  });

  it("happy path: returns a paginated list shape", async () => {
    const user = await registerUser();
    await createContact(user);

    const res = await fetch(`${BASE_URL}/contacts?limit=5&offset=0`, {
      headers: jsonHeaders(user),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toEqual({
      limit: 5,
      offset: 0,
      total: expect.any(Number),
    });
  });
});

describe("GET /contacts/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/contacts/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("happy path: returns the requested contact", async () => {
    const user = await registerUser();
    const contact = await createContact(user);

    const res = await fetch(`${BASE_URL}/contacts/${contact.id}`, {
      headers: jsonHeaders(user),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(contact.id);
  });

  it("not found: returns 404 for a non-existent contact", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/contacts/${randomUUID()}`, {
      headers: jsonHeaders(user),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Contact not found" });
  });
});

describe("PUT /contacts/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/contacts/${randomUUID()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });
    expect(res.status).toBe(401);
  });

  it("happy path: owner updates their contact", async () => {
    const user = await registerUser();
    const contact = await createContact(user);

    const res = await fetch(`${BASE_URL}/contacts/${contact.id}`, {
      method: "PUT",
      headers: jsonHeaders(user),
      body: JSON.stringify({ name: "Updated Name" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe("Updated Name");
  });

  it("not found: returns 404 for a non-existent contact", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/contacts/${randomUUID()}`, {
      method: "PUT",
      headers: jsonHeaders(user),
      body: JSON.stringify({ name: "x" }),
    });
    expect(res.status).toBe(404);
  });

  it("ownership: non-owner update returns 403", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const contact = await createContact(owner);

    const res = await fetch(`${BASE_URL}/contacts/${contact.id}`, {
      method: "PUT",
      headers: jsonHeaders(other),
      body: JSON.stringify({ name: "Hijacked" }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "Forbidden" });
  });
});

describe("DELETE /contacts/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/contacts/${randomUUID()}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  it("not found: returns 404 for a non-existent contact", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/contacts/${randomUUID()}`, {
      method: "DELETE",
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(404);
  });

  it("ownership: non-owner delete returns 403", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const contact = await createContact(owner);

    const res = await fetch(`${BASE_URL}/contacts/${contact.id}`, {
      method: "DELETE",
      headers: jsonHeaders(other),
    });

    expect(res.status).toBe(403);
  });

  it("happy path: owner deletes their contact, then it 404s", async () => {
    const user = await registerUser();
    const contact = await createContact(user);

    const del = await fetch(`${BASE_URL}/contacts/${contact.id}`, {
      method: "DELETE",
      headers: jsonHeaders(user),
    });
    expect(del.status).toBe(204);

    const get = await fetch(`${BASE_URL}/contacts/${contact.id}`, {
      headers: jsonHeaders(user),
    });
    expect(get.status).toBe(404);
  });
});
