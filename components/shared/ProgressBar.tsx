import { cn } from "@/lib/utils";

export function ProgressBar({ percent, label = true, size = "md", tone, className }: { percent: number; label?: boolean; size?: "sm" | "md"; tone?: "default" | "success" | "warn" | "danger"; className?: string }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const color = tone === "success" || p === 100 ? "bg-emerald-500" : tone === "danger" ? "bg-red-500" : tone === "warn" ? "bg-amber-500" : "bg-primary";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 overflow-hidden rounded-full bg-muted", size === "sm" ? "h-1" : "h-1.5")}>
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${p}%` }} />
      </div>
      {label && <span className="w-9 text-right text-[11px] font-medium tabular-nums">{p}%</span>}
    </div>
  );
}
