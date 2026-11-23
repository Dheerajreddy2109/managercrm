import { describe, expect, it } from "vitest";
import { checkPassword, signSessionToken, verifySessionToken } from "./auth";

const SECRET = "test-secret-that-is-definitely-longer-than-32-chars";

describe("session tokens", () => {
  it("round-trips a signed token", async () => {
    const token = await signSessionToken(SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe(true);
  });

  it("rejects a tampered token", async () => {
    const token = await signSessionToken(SECRET);
    const [h, p, s] = token.split(".");
    const tampered = `${h}.${p}${p.endsWith("A") ? "B" : "A"}.${s}`;
    expect(await verifySessionToken(tampered, SECRET)).toBe(false);
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signSessionToken("another-secret-that-is-also-32-chars-long!!");
    expect(await verifySessionToken(token, SECRET)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const fortyDaysAgo = Date.now() - 40 * 24 * 60 * 60 * 1000;
    const token = await signSessionToken(SECRET, fortyDaysAgo);
    expect(await verifySessionToken(token, SECRET)).toBe(false);
  });

  it("rejects missing token and short secrets", async () => {
    expect(await verifySessionToken(undefined, SECRET)).toBe(false);
    await expect(signSessionToken("short")).rejects.toThrow(/32 characters/);
  });
});

describe("checkPassword", () => {
  it("matches identical passwords and rejects others", () => {
    expect(checkPassword("hunter22", "hunter22")).toBe(true);
    expect(checkPassword("hunter2", "hunter22")).toBe(false);
    expect(checkPassword("hunter23", "hunter22")).toBe(false);
    expect(checkPassword("", "hunter22")).toBe(false);
  });
  it("fails closed when APP_PASSWORD is unset", () => {
    expect(checkPassword("anything", undefined)).toBe(false);
  });
});
