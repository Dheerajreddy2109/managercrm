import { describe, expect, it } from "vitest";
import { canonProject, parseEstimate, rollupStatus, techToRole, techToSkills } from "./importHelpers";

describe("import helpers", () => {
  it("merges spelling variants", () => {
    expect(canonProject("visaka vally")).toBe("Visakha Valley");
    expect(canonProject("Rockdeal")).toBe("RhockDeal");
    expect(canonProject("Srikuma Milk")).toBe("Srikumam Milk");
    expect(canonProject("glow nesty")).toBe("Glow Nesty");
    expect(canonProject("  rizhq ")).toBe("Rizhq");
  });
  it("parses estimates", () => {
    expect(parseEstimate("2 hours")).toBe(2);
    expect(parseEstimate("30 mins")).toBe(0.5);
    expect(parseEstimate("2 and half")).toBe(2.5);
    expect(parseEstimate("1 and half")).toBe(1.5);
    expect(parseEstimate("one day")).toBe(8);
    expect(parseEstimate("2 days")).toBe(16);
    expect(parseEstimate("eod")).toBeNull();
    expect(parseEstimate("?")).toBeNull();
    expect(parseEstimate("17-11-2026 afternoon")).toBeNull();
  });
  it("rolls up status", () => {
    expect(rollupStatus(["completed", "on_hold"])).toBe("on_hold");
    expect(rollupStatus(["completed", "active"])).toBe("active");
    expect(rollupStatus(["completed", "completed"])).toBe("completed");
    expect(rollupStatus([null])).toBe("active");
  });
  it("maps tech", () => {
    expect(techToSkills("Node & PHP")).toEqual(["node", "php"]);
    expect(techToRole("Node & Flutter")).toBe("fullstack");
    expect(techToRole("Tester")).toBe("qa");
  });
});
