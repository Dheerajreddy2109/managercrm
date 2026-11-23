/** Pure progress / health calculations (rules in CLAUDE.md). */
import { differenceInCalendarDays, parseISO } from "date-fns";
import { TASK_STATUSES, type TaskStatus } from "@/lib/db/schema";

export type TaskForProgress = { status: TaskStatus | string; estimatedHours: number; dueDate?: string | null };

export type ProgressResult = {
  percent: number;
  doneTasks: number;
  totalTasks: number;
  doneHours: number;
  totalHours: number;
  byStatus: Record<TaskStatus, number>;
  overdueTasks: number;
  blockedTasks: number;
};

export function emptyByStatus(): Record<TaskStatus, number> {
  return Object.fromEntries(TASK_STATUSES.map((s) => [s, 0])) as Record<TaskStatus, number>;
}

export type ProgressMethod = "tasks" | "hours";

/** "tasks": done ÷ all tasks (every task counts equally). "hours": done est. hours ÷ all est. hours (falls back to count when no estimates). */
export function computeProjectProgress(tasks: TaskForProgress[], today = new Date(), method: ProgressMethod = "hours"): ProgressResult {
  const byStatus = emptyByStatus();
  let doneTasks = 0, doneHours = 0, totalHours = 0, overdue = 0;
  const t = today.toISOString().slice(0, 10);
  for (const task of tasks) {
    const s = task.status as TaskStatus;
    if (s in byStatus) byStatus[s] += 1;
    const est = Number(task.estimatedHours) || 0;
    totalHours += est;
    if (s === "done") {
      doneTasks += 1;
      doneHours += est;
    } else if (task.dueDate && task.dueDate < t) {
      overdue += 1;
    }
  }
  const total = tasks.length;
  let percent = 0;
  if (total > 0) {
    percent = method === "hours" && totalHours > 0 ? (doneHours / totalHours) * 100 : (doneTasks / total) * 100;
  }
  return {
    percent: Math.round(percent),
    doneTasks,
    totalTasks: total,
    doneHours: round1(doneHours),
    totalHours: round1(totalHours),
    byStatus,
    overdueTasks: overdue,
    blockedTasks: byStatus.blocked,
  };
}

export type HealthInput = {
  status: string;
  startDate: string | null;
  targetEndDate: string | null;
};

/** Expected % complete by elapsed time, or null when dates are missing. */
export function expectedPercent(p: HealthInput, today = new Date()): number | null {
  if (!p.startDate || !p.targetEndDate) return null;
  const start = parseISO(p.startDate);
  const end = parseISO(p.targetEndDate);
  const span = differenceInCalendarDays(end, start);
  if (span <= 0) return 100;
  const elapsed = differenceInCalendarDays(today, start);
  return Math.min(100, Math.max(0, Math.round((elapsed / span) * 100)));
}

export function suggestHealth(p: HealthInput, progress: ProgressResult, today = new Date()): "green" | "amber" | "red" {
  if (p.status === "completed" || p.status === "cancelled") return "green";
  const t = today.toISOString().slice(0, 10);
  const pastTarget = !!p.targetEndDate && p.targetEndDate < t;
  if (progress.overdueTasks > 3) return "red";
  if (pastTarget && progress.percent < 100) return "red";
  if (progress.blockedTasks > 0) return "amber";
  const expected = expectedPercent(p, today);
  if (expected !== null && progress.percent < expected - 15) return "amber";
  return "green";
}

const round1 = (n: number) => Math.round(n * 10) / 10;
