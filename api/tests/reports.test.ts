import { describe, it, expect } from "vitest";
import { registerUser, createContact, createDeal, jsonHeaders, BASE_URL } from "./helpers.js";

// A window far enough in the future that no record created by any test
// in this suite can ever fall inside it — used to assert the
// zero-result behavior deterministically against a database shared by
// many independent tests.
const FAR_FUTURE_FROM = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
const FAR_FUTURE_TO = FAR_FUTURE_FROM + 24 * 60 * 60 * 1000;

describe("GET /reports/leads-added", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/reports/leads-added`);
    expect(res.status).toBe(401);
  });

  it("happy path: counts a contact created within the range", async () => {
    const user = await registerUser();
    const from = Date.now() - 1000;
    await createContact(user);
    const to = Date.now() + 1000;

    const res = await fetch(
      `${BASE_URL}/reports/leads-added?from=${from}&to=${to}`,
      { headers: jsonHeaders(user) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThanOrEqual(1);
  });

  it("zero-result range returns count 0, not an error", async () => {
    const user = await registerUser();
    const res = await fetch(
      `${BASE_URL}/reports/leads-added?from=${FAR_FUTURE_FROM}&to=${FAR_FUTURE_TO}`,
      { headers: jsonHeaders(user) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ count: 0, from: FAR_FUTURE_FROM, to: FAR_FUTURE_TO });
  });

  it("validation: from after to returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(
      `${BASE_URL}/reports/leads-added?from=${Date.now()}&to=${Date.now() - 1000}`,
      { headers: jsonHeaders(user) },
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /reports/deals-summary", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/reports/deals-summary`);
    expect(res.status).toBe(401);
  });

  it("happy path: counts a deal moved to 'won' within the range", async () => {
    const user = await registerUser();
    const from = Date.now() - 1000;
    await createDeal(user, { stage: "won", value: 250 });
    const to = Date.now() + 1000;

    const res = await fetch(
      `${BASE_URL}/reports/deals-summary?from=${from}&to=${to}`,
      { headers: jsonHeaders(user) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.won.count).toBeGreaterThanOrEqual(1);
  });

  it("zero-result range returns counts of 0, not an error", async () => {
    const user = await registerUser();
    const res = await fetch(
      `${BASE_URL}/reports/deals-summary?from=${FAR_FUTURE_FROM}&to=${FAR_FUTURE_TO}`,
      { headers: jsonHeaders(user) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      won: { count: 0, total: 0 },
      lost: { count: 0, total: 0 },
      from: FAR_FUTURE_FROM,
      to: FAR_FUTURE_TO,
    });
  });

  it("validation: from after to returns 400", async () => {
    const user = await registerUser();
    const res = await fetch(
      `${BASE_URL}/reports/deals-summary?from=${Date.now()}&to=${Date.now() - 1000}`,
      { headers: jsonHeaders(user) },
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /reports/upcoming-tasks", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/reports/upcoming-tasks`);
    expect(res.status).toBe(401);
  });

  it("happy path: returns a non-negative count without error", async () => {
    const user = await registerUser();
    const res = await fetch(`${BASE_URL}/reports/upcoming-tasks`, {
      headers: jsonHeaders(user),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.count).toBe("number");
    expect(body.count).toBeGreaterThanOrEqual(0);
  });
});
