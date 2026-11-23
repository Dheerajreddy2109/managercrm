/**
 * How a project's progress should be *shown*. Completed projects read as finished:
 * 100%, no overdue/blocked warnings, no "data suggests" health hint.
 * The underlying task data is untouched.
 */
export type ProjectForDisplay = {
  status: string;
  healthAuto?: string | null;
  progress: { percent: number; doneTasks: number; totalTasks: number; overdueTasks: number; blockedTasks: number };
};

export function projectDisplay(p: ProjectForDisplay) {
  const completed = p.status === "completed";
  return {
    completed,
    percent: completed ? 100 : p.progress.percent,
    overdue: completed ? 0 : p.progress.overdueTasks,
    blocked: completed ? 0 : p.progress.blockedTasks,
    healthAuto: completed ? null : (p.healthAuto ?? null),
    openTasks: p.progress.totalTasks - p.progress.doneTasks,
  };
}
