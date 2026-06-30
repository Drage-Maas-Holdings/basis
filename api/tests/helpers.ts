import { randomUUID } from "node:crypto";

export const BASE_URL = process.env.BASIS_TEST_BASE_URL ?? "http://127.0.0.1:4310";

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
  cookie: string;
};

function sessionCookieFromResponse(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("Expected a set-cookie header on auth response");
  }
  return setCookie.split(";")[0];
}

/** Registers a brand-new user with a unique email and returns its session cookie. */
export async function registerUser(name = "Test User"): Promise<AuthedUser> {
  const email = `${randomUUID()}@example.com`;
  const password = "password123";

  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (res.status !== 200) {
    throw new Error(`registerUser failed: ${res.status} ${await res.text()}`);
  }

  const cookie = sessionCookieFromResponse(res);
  const body = (await res.json()) as { user: { id: string } };

  return { id: body.user.id, email, name, cookie };
}

export function authHeaders(user: AuthedUser, extra: Record<string, string> = {}) {
  return { Cookie: user.cookie, ...extra };
}

export function jsonHeaders(user: AuthedUser) {
  return authHeaders(user, { "Content-Type": "application/json" });
}

export async function createApiToken(user: AuthedUser, name = "ci-token") {
  const res = await fetch(`${BASE_URL}/api-tokens`, {
    method: "POST",
    headers: jsonHeaders(user),
    body: JSON.stringify({ name }),
  });
  if (res.status !== 201) {
    throw new Error(`createApiToken failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { data: { key: string; id: string } };
  return body.data;
}

export async function createContact(
  user: AuthedUser,
  overrides: Record<string, unknown> = {},
) {
  const res = await fetch(`${BASE_URL}/contacts`, {
    method: "POST",
    headers: jsonHeaders(user),
    body: JSON.stringify({ name: `Contact ${randomUUID()}`, ...overrides }),
  });
  if (res.status !== 201) {
    throw new Error(`createContact failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { data: { id: string } };
  return body.data;
}

export async function createDeal(
  user: AuthedUser,
  overrides: Record<string, unknown> = {},
) {
  const res = await fetch(`${BASE_URL}/deals`, {
    method: "POST",
    headers: jsonHeaders(user),
    body: JSON.stringify({ title: `Deal ${randomUUID()}`, ...overrides }),
  });
  if (res.status !== 201) {
    throw new Error(`createDeal failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { data: { id: string } };
  return body.data;
}

export async function createTask(
  user: AuthedUser,
  overrides: Record<string, unknown> = {},
) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: jsonHeaders(user),
    body: JSON.stringify({ title: `Task ${randomUUID()}`, ...overrides }),
  });
  if (res.status !== 201) {
    throw new Error(`createTask failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { data: { id: string } };
  return body.data;
}
