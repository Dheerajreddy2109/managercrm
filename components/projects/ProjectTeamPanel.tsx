"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { PRIORITIES, PROJECT_STATUSES } from "@/lib/db/schema";
import { AvailabilityBadge, CapacityBar } from "@/components/shared/AvailabilityBadge";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/hooks/useApi";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MemberAvailability } from "@/lib/services/availability";
import type { getProject } from "@/lib/services/projects";
import Link from "next/link";

type PM = Awaited<ReturnType<typeof getProject>>["members"][number];

export function ProjectTeamPanel({ projectId, members }: { projectId: string; members: PM[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avail, setAvail] = useState<MemberAvailability[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [alloc, setAlloc] = useState("100");

  useEffect(() => { if (open) api<{ members: MemberAvailability[] }>("/api/availability").then((d) => setAvail(d.members)).catch(() => {}); }, [open]);
  const candidates = avail.filter((a) => !members.some((m) => m.id === a.member.id));

  async function add() {
    if (!pick) return;
    await api(`/api/projects/${projectId}/members`, { method: "POST", json: { memberId: pick, projectRole: role || null, allocationPercent: Number(alloc) || 0 } });
    toast.success("Member added"); setOpen(false); setPick(null); setRole(""); setAlloc("100"); router.refresh();
  }
  async function update(memberId: string, patch: Record<string, unknown>) { await api(`/api/projects/${projectId}/members/${memberId}`, { method: "PATCH", json: patch }); toast.success("Saved"); router.refresh(); }
  async function remove(memberId: string) { await api(`/api/projects/${projectId}/members/${memberId}`, { method: "DELETE" }); toast.success("Removed from project"); router.refresh(); }

  return (
    <div className="space-y-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" />}><UserPlus className="size-4" /> Add member</DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add to project</DialogTitle><DialogDescription>Availability shown for this week.</DialogDescription></DialogHeader>
          <ul className="max-h-64 space-y-0.5 overflow-y-auto">
            {candidates.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">{avail.length ? "Everyone is already on this project." : "Loading…"}</li>}
            {candidates.map((a) => (
              <li key={a.member.id}>
                <button type="button" onClick={() => setPick(a.member.id)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60", pick === a.member.id && "bg-primary/10 ring-1 ring-primary/30")}>
                  <MemberAvatar name={a.member.name} color={a.member.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between"><span className="text-sm">{a.member.name} <span className="text-xs text-muted-foreground">· {titleCase(a.member.role)}</span></span><AvailabilityBadge badge={a.badge} /></div>
                    <CapacityBar capacity={a.capacityHours} committed={a.committedHours} leave={a.leaveHours} className="mt-0.5" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <Input placeholder="Role on project (e.g. Frontend lead)" value={role} onChange={(e) => setRole(e.target.value)} />
            <Input type="number" min={0} max={100} value={alloc} onChange={(e) => setAlloc(e.target.value)} placeholder="%" />
          </div>
          <div className="flex justify-end"><Button onClick={add} disabled={!pick}>Add</Button></div>
        </DialogContent>
      </Dialog>

      {members.length === 0 ? <EmptyState title="No one on this project yet" /> : (
        <ul className="divide-y rounded-lg border">
          {members.map((m) => (
            <li key={m.id} className="space-y-2 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/team/${m.id}`} className="flex items-center gap-2 hover:underline"><MemberAvatar name={m.name} color={m.avatarColor} size="sm" /><span className="text-sm font-medium">{m.name}</span></Link>
                <span className="text-xs text-muted-foreground">{titleCase(m.role)}</span>
                <Button variant="ghost" size="icon" className="ml-auto size-7" onClick={() => remove(m.id)} aria-label="Remove"><X className="size-3.5" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <Input defaultValue={m.projectRole ?? ""} placeholder="Role" onBlur={(e) => { if (e.target.value !== (m.projectRole ?? "")) update(m.id, { projectRole: e.target.value || null }); }} className="h-7 text-xs" />
                <Input defaultValue={m.tech ?? ""} placeholder="Tech" onBlur={(e) => { if (e.target.value !== (m.tech ?? "")) update(m.id, { tech: e.target.value || null }); }} className="h-7 text-xs" />
                <NativeSelect defaultValue={m.assignmentStatus ?? ""} onChange={(e) => update(m.id, { status: e.target.value || null })} className="h-7 text-xs">
                  <option value="">Status…</option>{PROJECT_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </NativeSelect>
                <NativeSelect defaultValue={m.priority ?? ""} onChange={(e) => update(m.id, { priority: e.target.value || null })} className="h-7 text-xs">
                  <option value="">Priority…</option>{PRIORITIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </NativeSelect>
                <Input type="date" defaultValue={m.dueDate ?? ""} onBlur={(e) => { if (e.target.value !== (m.dueDate ?? "")) update(m.id, { dueDate: e.target.value || null }); }} className="h-7 text-xs" />
                <span className="flex items-center gap-1 text-xs"><Input type="number" min={0} max={100} placeholder="Progress" defaultValue={m.progressPercent ?? ""} onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== m.progressPercent) update(m.id, { progressPercent: v }); }} className="h-7 text-xs" />%</span>
              </div>
              <Textarea rows={2} defaultValue={m.notes ?? ""} placeholder="Notes / description (e.g. waiting for client approval)" onBlur={(e) => { if (e.target.value !== (m.notes ?? "")) update(m.id, { notes: e.target.value || null }); }} className="text-xs" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
