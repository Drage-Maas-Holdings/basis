import { describe, it, expect } from "vitest";
import { BASE_URL } from "./helpers.js";

describe("GET /health", () => {
  it("returns 200 with status ok, unauthenticated", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });
});
