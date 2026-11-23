/**
 * Pure availability calculation — no DB access, so it is unit-testable.
 * Rules are documented in CLAUDE.md ("Availability").
 */
import { addDays, eachDayOfInterval, isWeekend, max as maxDate, min as minDate, parseISO, startOfWeek } from "date-fns";

export type AvailabilityBadge = "free" | "light" | "busy" | "overloaded" | "on_leave";

export type MemberForCalc = { id: string; weeklyCapacityHours: number };
export type TaskForCalc = {
  assigneeId: string | null;
  status: string;
  estimatedHours: number;
  actualHours: number;
  dueDate: string | null; // YYYY-MM-DD
};
export type LeaveForCalc = { memberId: string; startDate: string; endDate: string };

export type AvailabilityResult = {
  memberId: string;
  capacityHours: number;
  leaveHours: number;
  committedHours: number;
  freeHours: number;
  utilizationPercent: number;
  badge: AvailabilityBadge;
  openTasks: number;
};

export const HOURS_PER_LEAVE_DAY = 8;

export function weekStartOf(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Is a task "committed" for the given week? */
export function isCommitted(task: TaskForCalc, weekStart: Date): boolean {
  if (task.status === "done") return false;
  if (task.status === "in_progress") return true;
  const ws = ymd(weekStart);
  const we = ymd(addDays(weekStart, 7));
  if (task.dueDate) return task.dueDate >= ws && task.dueDate < we;
  return task.status !== "backlog";
}

export function remainingHours(task: TaskForCalc) {
  return Math.max((task.estimatedHours ?? 0) - (task.actualHours ?? 0), 0);
}

/** Working-day hours of leave overlapping [weekStart, weekStart+7d). */
export function leaveHoursInWeek(leaves: LeaveForCalc[], weekStart: Date): number {
  const weekEnd = addDays(weekStart, 6);
  let days = 0;
  for (const l of leaves) {
    const s = maxDate([parseISO(l.startDate), weekStart]);
    const e = minDate([parseISO(l.endDate), weekEnd]);
    if (s > e) continue;
    days += eachDayOfInterval({ start: s, end: e }).filter((d) => !isWeekend(d)).length;
  }
  return days * HOURS_PER_LEAVE_DAY;
}

export function isOnLeave(leaves: LeaveForCalc[], today: Date): boolean {
  const t = ymd(today);
  return leaves.some((l) => l.startDate <= t && t <= l.endDate);
}

export function badgeFor(freeHours: number, capacity: number, onLeave: boolean): AvailabilityBadge {
  if (onLeave) return "on_leave";
  if (capacity <= 0) return "overloaded";
  const ratio = freeHours / capacity;
  if (ratio >= 0.6) return "free";
  if (ratio >= 0.3) return "light";
  if (ratio >= 0.1) return "busy";
  return "overloaded";
}

export function computeAvailability(
  member: MemberForCalc,
  tasks: TaskForCalc[],
  leaves: LeaveForCalc[],
  weekStart: Date,
  today: Date = new Date(),
): AvailabilityResult {
  const mine = tasks.filter((t) => t.assigneeId === member.id);
  const committed = mine.filter((t) => isCommitted(t, weekStart)).reduce((s, t) => s + remainingHours(t), 0);
  const leaveHours = leaveHoursInWeek(leaves.filter((l) => l.memberId === member.id), weekStart);
  const capacity = member.weeklyCapacityHours;
  const free = Math.max(capacity - leaveHours - committed, 0);
  const utilization = capacity > 0 ? Math.round(((committed + leaveHours) / capacity) * 100) : 100;
  return {
    memberId: member.id,
    capacityHours: capacity,
    leaveHours,
    committedHours: round1(committed),
    freeHours: round1(free),
    utilizationPercent: utilization,
    badge: badgeFor(free, capacity, isOnLeave(leaves.filter((l) => l.memberId === member.id), today)),
    openTasks: mine.filter((t) => t.status !== "done").length,
  };
}

/** Preview: what does assigning `hours` more do to this member? */
export function previewAssign(current: AvailabilityResult, hours: number, onLeave: boolean): AvailabilityResult {
  const committed = current.committedHours + Math.max(hours, 0);
  const free = Math.max(current.capacityHours - current.leaveHours - committed, 0);
  return {
    ...current,
    committedHours: round1(committed),
    freeHours: round1(free),
    utilizationPercent: current.capacityHours > 0 ? Math.round(((committed + current.leaveHours) / current.capacityHours) * 100) : 100,
    badge: badgeFor(free, current.capacityHours, onLeave),
    openTasks: current.openTasks + 1,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
