import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import {
  BASE_URL,
  registerUser,
  createContact,
  createDeal,
  jsonHeaders,
} from "./helpers.js";

describe("POST /deals", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/deals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nope" }),
    });
    expect(res.status).toBe(401);
  });

  it("happy path: creates a deal defaulting to stage 'new'", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/deals`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ title: "Big Deal", value: 1000 }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({
      title: "Big Deal",
      stage: "new",
      value: 1000,
      ownerId: user.id,
    });
  });

  it("validation: missing title returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/deals`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ value: 100 }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Title is required" });
  });

  it("validation: invalid stage returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/deals`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ title: "Bad Stage Deal", stage: "bogus" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Invalid stage" });
  });

  it("validation: non-existent contact_id returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/deals`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ title: "Linked Deal", contact_id: randomUUID() }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /deals", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/deals`);
    expect(res.status).toBe(401);
  });

  it("happy path: returns a paginated list shape", async () => {
    const user = await registerUser();
    await createDeal(user);

    const res = await fetch(`${BASE_URL}/deals`, { headers: jsonHeaders(user) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toHaveProperty("total");
  });
});

describe("GET /deals/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/deals/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("happy path: returns the deal with an embedded contact when linked", async () => {
    const user = await registerUser();
    const contact = await createContact(user);
    const deal = await createDeal(user, { contact_id: contact.id });

    const res = await fetch(`${BASE_URL}/deals/${deal.id}`, {
      headers: jsonHeaders(user),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(deal.id);
    expect(body.data.contact).toMatchObject({ id: contact.id });
  });

  it("not found: returns 404 for a non-existent deal", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/deals/${randomUUID()}`, {
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Deal not found" });
  });
});

describe("PUT /deals/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/deals/${randomUUID()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "won" }),
    });
    expect(res.status).toBe(401);
  });

  it("happy path: owner updates stage", async () => {
    const user = await registerUser();
    const deal = await createDeal(user);

    const res = await fetch(`${BASE_URL}/deals/${deal.id}`, {
      method: "PUT",
      headers: jsonHeaders(user),
      body: JSON.stringify({ stage: "won" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.stage).toBe("won");
  });

  it("validation: invalid stage returns 400", async () => {
    const user = await registerUser();
    const deal = await createDeal(user);

    const res = await fetch(`${BASE_URL}/deals/${deal.id}`, {
      method: "PUT",
      headers: jsonHeaders(user),
      body: JSON.stringify({ stage: "bogus" }),
    });
    expect(res.status).toBe(400);
  });

  it("not found: returns 404 for a non-existent deal", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/deals/${randomUUID()}`, {
      method: "PUT",
      headers: jsonHeaders(user),
      body: JSON.stringify({ stage: "won" }),
    });
    expect(res.status).toBe(404);
  });

  it("ownership: non-owner update returns 403", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const deal = await createDeal(owner);

    const res = await fetch(`${BASE_URL}/deals/${deal.id}`, {
      method: "PUT",
      headers: jsonHeaders(other),
      body: JSON.stringify({ stage: "won" }),
    });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /deals/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/deals/${randomUUID()}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  it("not found: returns 404 for a non-existent deal", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/deals/${randomUUID()}`, {
      method: "DELETE",
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(404);
  });

  it("ownership: non-owner delete returns 403", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const deal = await createDeal(owner);

    const res = await fetch(`${BASE_URL}/deals/${deal.id}`, {
      method: "DELETE",
      headers: jsonHeaders(other),
    });
    expect(res.status).toBe(403);
  });

  it("happy path: owner deletes their deal, then it 404s", async () => {
    const user = await registerUser();
    const deal = await createDeal(user);

    const del = await fetch(`${BASE_URL}/deals/${deal.id}`, {
      method: "DELETE",
      headers: jsonHeaders(user),
    });
    expect(del.status).toBe(204);

    const get = await fetch(`${BASE_URL}/deals/${deal.id}`, {
      headers: jsonHeaders(user),
    });
    expect(get.status).toBe(404);
  });
});
