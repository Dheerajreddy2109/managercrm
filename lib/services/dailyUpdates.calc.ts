/** Pure helpers for daily updates (rule: edits adjust task actual_hours by the delta, never double-count). */

export type TaskHours = { taskId: string; hours: number };

/** Per-task signed delta between previous and next task-hour rows. */
export function hoursDelta(previous: TaskHours[], next: TaskHours[]): TaskHours[] {
  const map = new Map<string, number>();
  for (const p of previous) map.set(p.taskId, (map.get(p.taskId) ?? 0) - p.hours);
  for (const n of next) map.set(n.taskId, (map.get(n.taskId) ?? 0) + n.hours);
  return [...map.entries()].filter(([, d]) => Math.abs(d) > 1e-9).map(([taskId, hours]) => ({ taskId, hours: round2(hours) }));
}

/** Collapse duplicate taskIds in the payload by summing hours. */
export function normalizeTaskHours(items: TaskHours[]): TaskHours[] {
  const map = new Map<string, number>();
  for (const i of items) map.set(i.taskId, (map.get(i.taskId) ?? 0) + i.hours);
  return [...map.entries()].map(([taskId, hours]) => ({ taskId, hours: round2(hours) }));
}

export function sumHours(items: TaskHours[]) {
  return round2(items.reduce((s, i) => s + i.hours, 0));
}

const round2 = (n: number) => Math.round(n * 100) / 100;
