import { cn } from "@/lib/utils";

const S = {
  free: { cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", label: "Free" },
  light: { cls: "bg-lime-500/10 text-lime-700 dark:text-lime-300", label: "Light" },
  busy: { cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300", label: "Busy" },
  overloaded: { cls: "bg-red-500/10 text-red-700 dark:text-red-300", label: "Overloaded" },
  on_leave: { cls: "bg-slate-500/10 text-slate-600 dark:text-slate-300", label: "On leave" },
} as const;

export type Badge = keyof typeof S;

export function AvailabilityBadge({ badge, className }: { badge: Badge | string; className?: string }) {
  const s = S[badge as Badge] ?? S.free;
  return <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap", s.cls, className)}>{s.label}</span>;
}

/** Capacity bar: committed vs capacity, leave shown hatched. */
export function CapacityBar({ capacity, committed, leave = 0, className }: { capacity: number; committed: number; leave?: number; className?: string }) {
  const total = Math.max(capacity, 1);
  const c = Math.min((committed / total) * 100, 100);
  const l = Math.min((leave / total) * 100, 100 - c);
  const over = committed + leave > capacity;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="flex h-full">
          <div className={cn("h-full", over ? "bg-red-500" : "bg-primary")} style={{ width: `${c}%` }} />
          <div className="h-full bg-slate-400/60" style={{ width: `${l}%` }} />
        </div>
      </div>
      <span className="w-16 text-right text-[11px] tabular-nums text-muted-foreground">
        {Math.round(committed)}/{capacity}h
      </span>
    </div>
  );
}
