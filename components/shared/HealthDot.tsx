import { cn } from "@/lib/utils";

const C = { green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500" } as const;
const L = { green: "On track", amber: "At risk", red: "Off track" } as const;

export function HealthDot({ health, auto, size = "md", className }: { health: keyof typeof C | string; auto?: string | null; size?: "sm" | "md"; className?: string }) {
  const h = (health in C ? health : "green") as keyof typeof C;
  const mismatch = auto && auto !== health;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={`${L[h]}${mismatch ? ` · data suggests ${auto}` : ""}`}>
      <span className={cn("rounded-full", size === "sm" ? "size-2" : "size-2.5", C[h])} />
      {mismatch && <span className={cn("rounded-full ring-1 ring-background", size === "sm" ? "size-1.5" : "size-2", C[auto as keyof typeof C] ?? "bg-muted")} />}
    </span>
  );
}

export function HealthLabel({ health }: { health: string }) {
  return <span className="text-xs text-muted-foreground">{L[(health as keyof typeof L)] ?? health}</span>;
}
