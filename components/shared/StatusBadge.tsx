import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/db/schema";

const STYLES: Record<string, string> = {
  backlog: "bg-muted text-muted-foreground",
  todo: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  in_review: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  blocked: "bg-red-500/10 text-red-700 dark:text-red-300",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  // project statuses
  planning: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  active: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  on_hold: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-muted text-muted-foreground line-through",
  // member statuses
  on_leave: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  inactive: "bg-muted text-muted-foreground",
};

export const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog", todo: "To do", in_progress: "In progress", in_review: "In review", blocked: "Blocked", done: "Done",
  planning: "Planning", active: "Active", on_hold: "On hold", completed: "Completed", cancelled: "Cancelled", on_leave: "On leave", inactive: "Inactive",
};

export function StatusBadge({ status, className }: { status: TaskStatus | string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap", STYLES[status] ?? "bg-muted", className)}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
