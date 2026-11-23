import { describe, expect, it } from "vitest";
import { projectDisplay } from "./projectDisplay";

const progress = { percent: 25, doneTasks: 1, totalTasks: 4, overdueTasks: 1, blockedTasks: 1 };

describe("projectDisplay", () => {
  it("shows a completed project as finished", () => {
    expect(projectDisplay({ status: "completed", healthAuto: "green", progress })).toEqual({
      completed: true, percent: 100, overdue: 0, blocked: 0, healthAuto: null, openTasks: 3,
    });
  });
  it("leaves other statuses unchanged", () => {
    for (const status of ["active", "planning", "on_hold", "cancelled"]) {
      expect(projectDisplay({ status, healthAuto: "red", progress })).toEqual({
        completed: false, percent: 25, overdue: 1, blocked: 1, healthAuto: "red", openTasks: 3,
      });
    }
  });
});
