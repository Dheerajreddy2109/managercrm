import { describe, expect, it } from "vitest";
import { hoursDelta, normalizeTaskHours, sumHours } from "./dailyUpdates.calc";

describe("hoursDelta", () => {
  it("first save: all hours are positive deltas", () => {
    expect(hoursDelta([], [{ taskId: "a", hours: 3 }])).toEqual([{ taskId: "a", hours: 3 }]);
  });
  it("editing 3h -> 5h yields +2 only", () => {
    expect(hoursDelta([{ taskId: "a", hours: 3 }], [{ taskId: "a", hours: 5 }])).toEqual([{ taskId: "a", hours: 2 }]);
  });
  it("removing a task yields a negative delta; unchanged tasks are omitted", () => {
    const d = hoursDelta([{ taskId: "a", hours: 3 }, { taskId: "b", hours: 2 }], [{ taskId: "b", hours: 2 }, { taskId: "c", hours: 1 }]);
    expect(d).toEqual(expect.arrayContaining([{ taskId: "a", hours: -3 }, { taskId: "c", hours: 1 }]));
    expect(d).toHaveLength(2);
  });
  it("saving the same payload twice is a no-op", () => {
    const rows = [{ taskId: "a", hours: 4.5 }];
    expect(hoursDelta(rows, rows)).toEqual([]);
  });
});

describe("normalize + sum", () => {
  it("merges duplicate task ids and sums", () => {
    const n = normalizeTaskHours([{ taskId: "a", hours: 1 }, { taskId: "a", hours: 2.25 }, { taskId: "b", hours: 1 }]);
    expect(n).toEqual([{ taskId: "a", hours: 3.25 }, { taskId: "b", hours: 1 }]);
    expect(sumHours(n)).toBe(4.25);
  });
});
