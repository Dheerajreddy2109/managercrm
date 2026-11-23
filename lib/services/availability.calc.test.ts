import { describe, expect, it } from "vitest";
import { badgeFor, computeAvailability, isCommitted, leaveHoursInWeek, previewAssign, type TaskForCalc } from "./availability.calc";

const weekStart = new Date("2026-11-09T00:00:00Z"); // Monday
const today = new Date("2026-11-10T09:00:00Z"); // Tuesday
const m = { id: "m1", weeklyCapacityHours: 40 };
const t = (over: Partial<TaskForCalc>): TaskForCalc => ({ assigneeId: "m1", status: "todo", estimatedHours: 0, actualHours: 0, dueDate: null, ...over });

describe("computeAvailability", () => {
  it("40h capacity, 10h committed -> free", () => {
    const r = computeAvailability(m, [t({ status: "in_progress", estimatedHours: 10 })], [], weekStart, today);
    expect(r.committedHours).toBe(10);
    expect(r.freeHours).toBe(30);
    expect(r.badge).toBe("free");
    expect(r.utilizationPercent).toBe(25);
  });

  it("38h committed -> overloaded", () => {
    const r = computeAvailability(m, [t({ status: "in_progress", estimatedHours: 38 })], [], weekStart, today);
    expect(r.freeHours).toBe(2);
    expect(r.badge).toBe("overloaded");
  });

  it("subtracts actual hours from estimates and floors at zero", () => {
    const r = computeAvailability(m, [t({ status: "in_progress", estimatedHours: 10, actualHours: 12 }), t({ status: "in_progress", estimatedHours: 8, actualHours: 3 })], [], weekStart, today);
    expect(r.committedHours).toBe(5);
  });

  it("ignores done tasks and other members' tasks", () => {
    const r = computeAvailability(m, [t({ status: "done", estimatedHours: 30 }), t({ assigneeId: "m2", status: "in_progress", estimatedHours: 30 })], [], weekStart, today);
    expect(r.committedHours).toBe(0);
    expect(r.openTasks).toBe(0);
  });

  it("member on leave today -> on_leave, with leave hours deducted", () => {
    const leaves = [{ memberId: "m1", startDate: "2026-11-10", endDate: "2026-11-11" }];
    const r = computeAvailability(m, [], leaves, weekStart, today);
    expect(r.leaveHours).toBe(16);
    expect(r.freeHours).toBe(24);
    expect(r.badge).toBe("on_leave");
  });

  it("leave later this week deducts hours but badge is not on_leave", () => {
    const leaves = [{ memberId: "m1", startDate: "2026-11-13", endDate: "2026-11-13" }];
    const r = computeAvailability(m, [], leaves, weekStart, today);
    expect(r.leaveHours).toBe(8);
    expect(r.badge).toBe("free");
  });
});

describe("isCommitted", () => {
  it("in_progress always counts", () => expect(isCommitted(t({ status: "in_progress", dueDate: "2027-01-01" }), weekStart)).toBe(true));
  it("todo due this week counts", () => expect(isCommitted(t({ dueDate: "2026-11-13" }), weekStart)).toBe(true));
  it("todo due next week does not", () => expect(isCommitted(t({ dueDate: "2026-11-20" }), weekStart)).toBe(false));
  it("todo with no due date counts, backlog with no due date does not", () => {
    expect(isCommitted(t({ dueDate: null }), weekStart)).toBe(true);
    expect(isCommitted(t({ status: "backlog", dueDate: null }), weekStart)).toBe(false);
  });
});

describe("leaveHoursInWeek", () => {
  it("counts only weekdays inside the week", () => {
    const leaves = [{ memberId: "m1", startDate: "2026-11-05", endDate: "2026-11-16" }]; // spans two weekends
    expect(leaveHoursInWeek(leaves, weekStart)).toBe(40);
  });
});

describe("badges and preview", () => {
  it("thresholds", () => {
    expect(badgeFor(24, 40, false)).toBe("free");
    expect(badgeFor(12, 40, false)).toBe("light");
    expect(badgeFor(4, 40, false)).toBe("busy");
    expect(badgeFor(3, 40, false)).toBe("overloaded");
    expect(badgeFor(40, 40, true)).toBe("on_leave");
  });
  it("previewAssign adds hours", () => {
    const cur = computeAvailability(m, [t({ status: "in_progress", estimatedHours: 10 })], [], weekStart, today);
    const p = previewAssign(cur, 20, false);
    expect(p.committedHours).toBe(30);
    expect(p.freeHours).toBe(10);
    expect(p.badge).toBe("busy");
  });
});
