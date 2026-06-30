import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { BASE_URL, registerUser, createTask, jsonHeaders } from "./helpers.js";

describe("POST /tasks", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nope" }),
    });
    expect(res.status).toBe(401);
  });

  it("happy path: creates a task owned by the caller", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ title: "Follow up", due_at: Date.now() + 86400000 }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({
      title: "Follow up",
      completed: 0,
      ownerId: user.id,
    });
  });

  it("validation: missing title returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Title is required" });
  });

  it("validation: invalid due_at returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: jsonHeaders(user),
      body: JSON.stringify({ title: "Bad due date", due_at: "not-a-number" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /tasks", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/tasks`);
    expect(res.status).toBe(401);
  });

  it("happy path: returns a paginated list shape", async () => {
    const user = await registerUser();
    await createTask(user);

    const res = await fetch(`${BASE_URL}/tasks`, { headers: jsonHeaders(user) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination).toHaveProperty("total");
  });
});

describe("GET /tasks/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/tasks/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("happy path: returns the requested task", async () => {
    const user = await registerUser();
    const task = await createTask(user);

    const res = await fetch(`${BASE_URL}/tasks/${task.id}`, {
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(task.id);
  });

  it("not found: returns 404 for a non-existent task", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/tasks/${randomUUID()}`, {
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(404);
  });
});

describe("PUT /tasks/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/tasks/${randomUUID()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    expect(res.status).toBe(401);
  });

  it("happy path: owner marks task completed", async () => {
    const user = await registerUser();
    const task = await createTask(user);

    const res = await fetch(`${BASE_URL}/tasks/${task.id}`, {
      method: "PUT",
      headers: jsonHeaders(user),
      body: JSON.stringify({ completed: true }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.completed).toBe(1);
  });

  it("not found: returns 404 for a non-existent task", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/tasks/${randomUUID()}`, {
      method: "PUT",
      headers: jsonHeaders(user),
      body: JSON.stringify({ completed: true }),
    });
    expect(res.status).toBe(404);
  });

  it("ownership: non-owner update returns 403", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const task = await createTask(owner);

    const res = await fetch(`${BASE_URL}/tasks/${task.id}`, {
      method: "PUT",
      headers: jsonHeaders(other),
      body: JSON.stringify({ completed: true }),
    });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /tasks/:id", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/tasks/${randomUUID()}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  it("not found: returns 404 for a non-existent task", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/tasks/${randomUUID()}`, {
      method: "DELETE",
      headers: jsonHeaders(user),
    });
    expect(res.status).toBe(404);
  });

  it("ownership: non-owner delete returns 403", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const task = await createTask(owner);

    const res = await fetch(`${BASE_URL}/tasks/${task.id}`, {
      method: "DELETE",
      headers: jsonHeaders(other),
    });
    expect(res.status).toBe(403);
  });

  it("happy path: owner deletes their task, then it 404s", async () => {
    const user = await registerUser();
    const task = await createTask(user);

    const del = await fetch(`${BASE_URL}/tasks/${task.id}`, {
      method: "DELETE",
      headers: jsonHeaders(user),
    });
    expect(del.status).toBe(204);

    const get = await fetch(`${BASE_URL}/tasks/${task.id}`, {
      headers: jsonHeaders(user),
    });
    expect(get.status).toBe(404);
  });
});
