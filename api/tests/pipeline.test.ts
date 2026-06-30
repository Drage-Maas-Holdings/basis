import { describe, it, expect } from "vitest";
import { BASE_URL, registerUser, createDeal, jsonHeaders } from "./helpers.js";

const STAGES = ["new", "qualified", "won", "lost"] as const;

describe("GET /pipeline", () => {
  it("authentication gate: unauthenticated request returns 401", async () => {
    const res = await fetch(`${BASE_URL}/pipeline`);
    expect(res.status).toBe(401);
  });

  it("all four stages are present even when scoped to a user with no deals", async () => {
    const user = await registerUser();

    const res = await fetch(`${BASE_URL}/pipeline?owner_id=${user.id}`, {
      headers: jsonHeaders(user),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    for (const stage of STAGES) {
      expect(body.stages[stage]).toEqual({ deals: [], count: 0, total: 0 });
    }
    expect(body.summary).toEqual({ totalCount: 0, totalValue: 0 });
  });

  it("happy path: groups deals by stage", async () => {
    const user = await registerUser();
    await createDeal(user, { stage: "won", value: 500 });
    await createDeal(user, { stage: "new" });

    const res = await fetch(`${BASE_URL}/pipeline?owner_id=${user.id}`, {
      headers: jsonHeaders(user),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stages.won.count).toBe(1);
    expect(body.stages.won.total).toBe(500);
    expect(body.stages.new.count).toBe(1);
    expect(body.summary.totalCount).toBe(2);
    expect(body.summary.totalValue).toBe(500);
  });
});
