import { describe, expect, it } from "vitest";
import { computeProjectProgress, expectedPercent, suggestHealth } from "./progress.calc";

const today = new Date("2026-11-10T09:00:00Z");

describe("computeProjectProgress", () => {
  it("weights by estimated hours when estimates exist", () => {
    const r = computeProjectProgress(
      [
        { status: "done", estimatedHours: 30 },
        { status: "todo", estimatedHours: 10 },
        { status: "in_progress", estimatedHours: 10 },
      ],
      today,
    );
    expect(r.percent).toBe(60);
    expect(r.doneTasks).toBe(1);
    expect(r.totalTasks).toBe(3);
    expect(r.byStatus.in_progress).toBe(1);
  });

  it("falls back to task count when no task has an estimate", () => {
    const r = computeProjectProgress([{ status: "done", estimatedHours: 0 }, { status: "todo", estimatedHours: 0 }, { status: "done", estimatedHours: 0 }], today);
    expect(r.percent).toBe(67);
  });

  it("tasks with missing estimates count as 0 hours while estimates exist elsewhere", () => {
    const r = computeProjectProgress([{ status: "done", estimatedHours: 0 }, { status: "todo", estimatedHours: 10 }], today);
    expect(r.percent).toBe(0);
  });

  it("zero tasks -> 0", () => {
    expect(computeProjectProgress([], today).percent).toBe(0);
  });

  it("counts overdue and blocked", () => {
    const r = computeProjectProgress(
      [
        { status: "todo", estimatedHours: 1, dueDate: "2026-11-01" },
        { status: "done", estimatedHours: 1, dueDate: "2026-11-01" },
        { status: "blocked", estimatedHours: 1, dueDate: "2026-12-01" },
      ],
      today,
    );
    expect(r.overdueTasks).toBe(1);
    expect(r.blockedTasks).toBe(1);
  });
});

describe("suggestHealth", () => {
  const base = { status: "active", startDate: "2026-10-01", targetEndDate: "2026-12-10" }; // 70 days, 40 elapsed -> 57%
  const prog = (percent: number, overdue = 0, blocked = 0) => ({
    percent, doneTasks: 0, totalTasks: 1, doneHours: 0, totalHours: 0,
    byStatus: { backlog: 0, todo: 0, in_progress: 0, in_review: 0, blocked, done: 0 }, overdueTasks: overdue, blockedTasks: blocked,
  });

  it("expected percent by elapsed time", () => expect(expectedPercent(base, today)).toBe(57));
  it("red when more than 3 overdue", () => expect(suggestHealth(base, prog(90, 4), today)).toBe("red"));
  it("red when past target and not done", () => expect(suggestHealth({ ...base, targetEndDate: "2026-11-01" }, prog(80), today)).toBe("red"));
  it("amber when blocked", () => expect(suggestHealth(base, prog(60, 0, 1), today)).toBe("amber"));
  it("amber when behind schedule by > 15", () => expect(suggestHealth(base, prog(40), today)).toBe("amber"));
  it("green when on track", () => expect(suggestHealth(base, prog(50), today)).toBe("green"));
  it("green when completed regardless", () => expect(suggestHealth({ ...base, status: "completed", targetEndDate: "2026-01-01" }, prog(50, 9), today)).toBe("green"));
});

describe("progress method", () => {
  const ts = [
    { status: "done", estimatedHours: 0 },
    { status: "in_progress", estimatedHours: 2.5 },
    { status: "in_progress", estimatedHours: 2.5 },
  ];
  it("tasks: counts every task equally", () => expect(computeProjectProgress(ts, new Date(), "tasks").percent).toBe(33));
  it("hours: weights by estimate", () => expect(computeProjectProgress(ts, new Date(), "hours").percent).toBe(0));
});
