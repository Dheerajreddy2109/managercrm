"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/hooks/useApi";
import { dueLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { getProject } from "@/lib/services/projects";

type Milestone = Awaited<ReturnType<typeof getProject>>["milestones"][number];

export function MilestonesPanel({ projectId, milestones }: { projectId: string; milestones: Milestone[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [due, setDue] = useState("");
  async function add() {
    if (!name.trim()) return;
    await api(`/api/projects/${projectId}/milestones`, { method: "POST", json: { name: name.trim(), dueDate: due || null } });
    toast.success("Milestone added"); setName(""); setDue(""); router.refresh();
  }
  const act = async (id: string, patch: Record<string, unknown>) => { await api(`/api/projects/${projectId}/milestones/${id}`, { method: "PATCH", json: patch }); router.refresh(); };
  const del = async (id: string) => { await api(`/api/projects/${projectId}/milestones/${id}`, { method: "DELETE" }); toast.success("Milestone deleted"); router.refresh(); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="New milestone" value={name} onChange={(e) => setName(e.target.value)} className="w-64" onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-40" />
        <Button size="sm" onClick={add} disabled={!name.trim()}><Plus className="size-3.5" /> Add</Button>
      </div>
      {milestones.length === 0 ? <EmptyState icon={Flag} title="No milestones" description="Group tasks into milestones to track phases." /> : (
        <ul className="divide-y rounded-lg border">
          {milestones.map((m) => {
            const d = dueLabel(m.dueDate, m.status === "done");
            return (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                <Flag className={cn("size-4", m.status === "done" ? "text-emerald-600" : "text-violet-600")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm"><span className={cn("font-medium", m.status === "done" && "text-muted-foreground line-through")}>{m.name}</span><span className={cn("text-xs", d.tone === "danger" ? "text-red-600" : d.tone === "warn" ? "text-amber-600" : "text-muted-foreground")}>{m.dueDate ? d.text : "No date"}</span></div>
                  <ProgressBar percent={m.progress.percent} size="sm" className="mt-1 max-w-xs" />
                  <div className="text-[11px] text-muted-foreground">{m.progress.doneTasks}/{m.progress.totalTasks} tasks{m.progress.overdueTasks > 0 && <span className="text-red-600"> · {m.progress.overdueTasks} overdue</span>}</div>
                </div>
                <Input type="date" value={m.dueDate ?? ""} onChange={(e) => act(m.id, { dueDate: e.target.value || null })} className="hidden w-36 sm:block" />
                {m.status === "done" ? <Button variant="ghost" size="xs" onClick={() => act(m.id, { status: "open" })}><RotateCcw className="size-3" /> Reopen</Button> : <Button variant="outline" size="xs" onClick={() => act(m.id, { status: "done" })}><Check className="size-3" /> Done</Button>}
                <Button variant="ghost" size="icon" className="size-7" onClick={() => del(m.id)} aria-label="Delete"><Trash2 className="size-3.5" /></Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
