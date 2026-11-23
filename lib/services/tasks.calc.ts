/** Pure task helpers (rules in CLAUDE.md "Task status transitions"). */
import type { TaskStatus } from "@/lib/db/schema";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  in_review: "In review",
  blocked: "Blocked",
  done: "Done",
};

export type TransitionInput = {
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  startedAt: Date | null;
  completedAt: Date | null;
};

export type TransitionPatch = { status: TaskStatus; startedAt?: Date | null; completedAt?: Date | null };

/**
 * Entering in_progress for the first time sets startedAt.
 * Entering done sets completedAt. Leaving done clears completedAt.
 */
export function transitionPatch(input: TransitionInput, now = new Date()): TransitionPatch {
  const patch: TransitionPatch = { status: input.toStatus };
  if (input.toStatus === "in_progress" && !input.startedAt) patch.startedAt = now;
  if (input.toStatus === "done") {
    patch.completedAt = now;
    if (!input.startedAt) patch.startedAt = now;
  }
  if (input.fromStatus === "done" && input.toStatus !== "done") patch.completedAt = null;
  return patch;
}

export function transitionMessage(from: TaskStatus, to: TaskStatus) {
  return from === to ? `Reordered in ${STATUS_LABELS[to]}` : `Moved to ${STATUS_LABELS[to]}`;
}

/** Hours still needed on a task (never negative). */
export function remaining(estimatedHours: number, actualHours: number) {
  return Math.max((estimatedHours ?? 0) - (actualHours ?? 0), 0);
}
