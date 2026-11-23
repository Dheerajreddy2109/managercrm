import { describe, expect, it } from "vitest";
import { csvEscape, toCsv } from "./csv";

describe("csv", () => {
  it("escapes quotes, commas and newlines", () => {
    expect(csvEscape('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvEscape("a\nb")).toBe('"a\nb"');
    expect(csvEscape("plain")).toBe("plain");
  });
  it("handles null, dates and arrays", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(new Date("2026-11-10T00:00:00Z"))).toBe("2026-11-10T00:00:00.000Z");
    expect(csvEscape(["ui", "api"])).toBe("ui; api");
  });
  it("neutralises formula injection", () => {
    expect(csvEscape("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvEscape("-5")).toBe("'-5");
  });
  it("writes header + rows with BOM and CRLF", () => {
    const out = toCsv([{ a: 1, b: "x" }], [{ key: "a", header: "A" }, { key: "b", header: "B" }]);
    expect(out).toBe("﻿A,B\r\n1,x\r\n");
  });
});
