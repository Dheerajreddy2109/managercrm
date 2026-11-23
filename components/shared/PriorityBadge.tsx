import { ArrowDown, ArrowUp, ChevronsUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const P = {
  low: { icon: ArrowDown, cls: "text-muted-foreground", label: "Low" },
  medium: { icon: Minus, cls: "text-slate-500", label: "Medium" },
  high: { icon: ArrowUp, cls: "text-amber-600", label: "High" },
  urgent: { icon: ChevronsUp, cls: "text-red-600", label: "Urgent" },
} as const;

export function PriorityBadge({ priority, showLabel = false, className }: { priority: keyof typeof P | string; showLabel?: boolean; className?: string }) {
  const p = P[priority as keyof typeof P] ?? P.medium;
  const Icon = p.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", p.cls, className)} title={p.label}>
      <Icon className="size-3.5" />
      {showLabel && p.label}
    </span>
  );
}
