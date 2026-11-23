import { describe, expect, it } from "vitest";
import { remaining, transitionMessage, transitionPatch } from "./tasks.calc";

const now = new Date("2026-11-10T10:00:00Z");
const earlier = new Date("2026-11-01T10:00:00Z");

describe("transitionPatch", () => {
  it("sets startedAt the first time a task enters in_progress", () => {
    expect(transitionPatch({ fromStatus: "todo", toStatus: "in_progress", startedAt: null, completedAt: null }, now)).toEqual({ status: "in_progress", startedAt: now });
  });
  it("keeps the original startedAt on re-entry", () => {
    expect(transitionPatch({ fromStatus: "blocked", toStatus: "in_progress", startedAt: earlier, completedAt: null }, now)).toEqual({ status: "in_progress" });
  });
  it("sets completedAt (and startedAt if missing) when entering done", () => {
    expect(transitionPatch({ fromStatus: "in_review", toStatus: "done", startedAt: null, completedAt: null }, now)).toEqual({ status: "done", completedAt: now, startedAt: now });
    expect(transitionPatch({ fromStatus: "in_review", toStatus: "done", startedAt: earlier, completedAt: null }, now)).toEqual({ status: "done", completedAt: now });
  });
  it("clears completedAt when leaving done", () => {
    expect(transitionPatch({ fromStatus: "done", toStatus: "todo", startedAt: earlier, completedAt: earlier }, now)).toEqual({ status: "todo", completedAt: null });
  });
  it("no timestamps for other moves", () => {
    expect(transitionPatch({ fromStatus: "todo", toStatus: "blocked", startedAt: null, completedAt: null }, now)).toEqual({ status: "blocked" });
  });
});

describe("helpers", () => {
  it("messages", () => {
    expect(transitionMessage("todo", "in_review")).toBe("Moved to In review");
    expect(transitionMessage("todo", "todo")).toBe("Reordered in To do");
  });
  it("remaining floors at zero", () => {
    expect(remaining(10, 4)).toBe(6);
    expect(remaining(3, 7)).toBe(0);
  });
});
