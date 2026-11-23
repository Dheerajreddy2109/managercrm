"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AvailabilityBadge, CapacityBar } from "@/components/shared/AvailabilityBadge";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { api } from "@/lib/hooks/useApi";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";
import { badgeFor } from "@/lib/services/availability.calc";
import type { MemberAvailability } from "@/lib/services/availability";

export type AssignResult = { task: { id: string; assigneeId: string | null }; warning: string | null };

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** When taskId is set the dialog calls POST /assign. When omitted it only returns the pick via onPick (used by the New task form). */
  taskId?: string;
  taskTitle?: string;
  remainingHours?: number;
  currentAssigneeId?: string | null;
  onAssigned?: (r: AssignResult) => void;
  onPick?: (m: MemberAvailability | null) => void;
};

export function AssignDialog({ open, onOpenChange, taskId, taskTitle, remainingHours = 0, currentAssigneeId, onAssigned, onPick }: Props) {
  const [rows, setRows] = useState<MemberAvailability[] | null>(null);
  const [q, setQ] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [selected, setSelected] = useState<string | null>(currentAssigneeId ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api<{ members: MemberAvailability[] }>("/api/availability").then((d) => { if (!cancelled) setRows(d.members); }).catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  // Reset the selection each time the dialog opens (render-time state adjustment, not an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) { setWasOpen(open); if (open) setSelected(currentAssigneeId ?? null); }

  const filtered = useMemo(() => {
    const list = rows ?? [];
    return list.filter((r) => {
      if (onlyFree && !(r.badge === "free" || r.badge === "light")) return false;
      if (q && !`${r.member.name} ${r.member.role}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, onlyFree]);

  const sel = rows?.find((r) => r.member.id === selected) ?? null;
  const preview = sel
    ? (() => {
        const extra = sel.member.id === currentAssigneeId ? 0 : remainingHours;
        const committed = sel.committedHours + extra;
        const free = Math.max(sel.capacityHours - sel.leaveHours - committed, 0);
        return { free: Math.round(free * 10) / 10, badge: badgeFor(free, sel.capacityHours, sel.badge === "on_leave") };
      })()
    : null;

  async function confirm(assigneeId: string | null) {
    if (!taskId) { onPick?.(assigneeId ? sel : null); onOpenChange(false); return; }
    setBusy(true);
    try {
      const r = await api<AssignResult>(`/api/tasks/${taskId}/assign`, { method: "POST", json: { assigneeId } });
      if (r.warning) toast.warning(r.warning); else toast.success(assigneeId ? `Assigned to ${sel?.member.name}` : "Unassigned");
      onAssigned?.(r);
      onOpenChange(false);
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign{taskTitle ? `: ${taskTitle}` : " task"}</DialogTitle>
          <DialogDescription>Sorted by who has the most free hours this week{remainingHours > 0 ? ` · this task needs ~${remainingHours}h` : ""}.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name or role" value={q} onChange={(e) => setQ(e.target.value)} className="pl-7" autoFocus />
          </div>
          <label className="flex items-center gap-1.5 text-xs whitespace-nowrap"><Checkbox checked={onlyFree} onCheckedChange={(v) => setOnlyFree(v === true)} /> Only free &amp; light</label>
        </div>
        <ul className="-mx-1 max-h-72 space-y-0.5 overflow-y-auto px-1">
          {rows === null && <li className="py-6 text-center text-sm text-muted-foreground">Loading availability…</li>}
          {rows !== null && filtered.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No members match.</li>}
          {filtered.map((r) => (
            <li key={r.member.id}>
              <button
                type="button"
                onClick={() => setSelected(r.member.id)}
                className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60", selected === r.member.id && "bg-primary/10 ring-1 ring-primary/30")}
              >
                <MemberAvatar name={r.member.name} color={r.member.avatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{r.member.name} <span className="text-xs text-muted-foreground">· {titleCase(r.member.role)} · {r.projects.length} project{r.projects.length === 1 ? "" : "s"}</span></span>
                    <AvailabilityBadge badge={r.badge} />
                  </div>
                  <CapacityBar capacity={r.capacityHours} committed={r.committedHours} leave={r.leaveHours} className="mt-0.5" />
                </div>
              </button>
            </li>
          ))}
        </ul>
        {sel && preview && (
          <div className={cn("rounded-md border px-3 py-2 text-sm", preview.badge === "overloaded" || preview.badge === "on_leave" ? "border-red-500/30 bg-red-500/5" : preview.badge === "busy" ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5")}>
            After this task: <span className="font-medium">{sel.member.name}</span> would have <span className="font-medium">{preview.free}h free</span> <AvailabilityBadge badge={preview.badge} className="ml-1" />
          </div>
        )}
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" size="sm" onClick={() => confirm(null)} disabled={busy || (!currentAssigneeId && !taskId)}><UserMinus className="size-3.5" /> Unassign</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => confirm(selected)} disabled={busy || !selected}>{busy ? "Assigning…" : "Assign"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
