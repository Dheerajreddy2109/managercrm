import { describe, expect, it } from "vitest";
import { rateLimit, resetRateLimit } from "./rateLimit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks within the window", () => {
    const key = "t1";
    resetRateLimit(key);
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimit(key, 5, 60_000, now).allowed).toBe(true);
    const sixth = rateLimit(key, 5, 60_000, now + 10);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterSec).toBeGreaterThan(0);
  });
  it("resets after the window", () => {
    const key = "t2";
    resetRateLimit(key);
    for (let i = 0; i < 6; i++) rateLimit(key, 5, 60_000, 0);
    expect(rateLimit(key, 5, 60_000, 60_001).allowed).toBe(true);
  });
});
