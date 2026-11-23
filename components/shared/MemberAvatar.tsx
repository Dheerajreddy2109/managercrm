import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function MemberAvatar({ name, color, size = "md", className }: { name: string; color?: string | null; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const sz = { xs: "size-5 text-[9px]", sm: "size-6 text-[10px]", md: "size-7 text-[11px]", lg: "size-10 text-sm" }[size];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-background", sz, className)}
      style={{ backgroundColor: color ?? "#6366f1" }}
      title={name}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ people, max = 4 }: { people: { id: string; name: string; avatarColor?: string | null }[]; max?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="inline-flex -space-x-1.5">
      {shown.map((p) => <MemberAvatar key={p.id} name={p.name} color={p.avatarColor} size="sm" />)}
      {rest > 0 && <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-1 ring-background">+{rest}</span>}
    </span>
  );
}
