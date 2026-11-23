"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Download, Search, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { STATUS_LABEL } from "@/components/shared/StatusBadge";
import { PRIORITIES, TASK_STATUSES } from "@/lib/db/schema";
import { api } from "@/lib/hooks/useApi";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AssignDialog } from "./AssignDialog";
import { TaskSheet } from "./TaskSheet";
import { TaskTable } from "./TaskTable";
import type { BoardTask } from "@/components/projects/KanbanBoard";

const QUICK = [
  { key: "", label: "Open", params: {} },
  { key: "overdue", label: "Overdue", params: { overdue: "true" } },
  { key: "unassigned", label: "Unassigned", params: { unassigned: "true" } },
  { key: "week", label: "Due this week", params: { due: "week" } },
  { key: "blocked", label: "Blocked", params: { status: "blocked" } },
  { key: "done", label: "Done", params: { status: "done" } },
] as const;

export function TasksPageClient({ tasks, total, projects, members, active }: {
  tasks: BoardTask[]; total: number; projects: { id: string; name: string }[]; members: { id: string; name: string }[]; active: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const [search, setSearch] = useState(params.get("search") ?? "");

  const setParams = useCallback((patch: Record<string, string | null>, replaceAll = false) => {
    const n = replaceAll ? new URLSearchParams() : new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); }
    n.delete("task");
    router.push(n.size ? `${pathname}?${n}` : pathname);
  }, [params, pathname, router]);
  const openTask = (id: string) => { const n = new URLSearchParams(params.toString()); n.set("task", id); router.replace(`${pathname}?${n}`); };
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (tasks.every((t) => s.has(t.id)) ? new Set() : new Set(tasks.map((t) => t.id))));

  async function bulkStatus(status: string) {
    const ids = [...selected];
    await Promise.all(ids.map((id) => api(`/api/tasks/${id}/move`, { method: "POST", json: { status }, silent: true })));
    toast.success(`${ids.length} task${ids.length === 1 ? "" : "s"} moved to ${STATUS_LABEL[status]}`); setSelected(new Set()); router.refresh();
  }
  async function bulkAssign(assigneeId: string | null) {
    const ids = [...selected];
    const results = await Promise.all(ids.map((id) => api<{ warning: string | null }>(`/api/tasks/${id}/assign`, { method: "POST", json: { assigneeId }, silent: true })));
    const warn = results.find((r) => r.warning)?.warning;
    if (warn) toast.warning(warn); else toast.success(`${ids.length} task${ids.length === 1 ? "" : "s"} ${assigneeId ? "assigned" : "unassigned"}`);
    setSelected(new Set()); router.refresh();
  }

  const exportHref = `/api/export/tasks?${params.toString()}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1">
        {QUICK.map((q) => (
          <Button key={q.key} size="sm" variant={active === q.key ? "secondary" : "ghost"} onClick={() => setParams({ ...q.params }, true)}>{q.label}</Button>
        ))}
        <a href={exportHref} className="ml-auto"><Button size="sm" variant="outline"><Download className="size-3.5" /> Export CSV</Button></a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setParams({ search: search || null }); }} className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} className="w-52 pl-7" />
        </form>
        <NativeSelect value={params.get("projectId") ?? ""} onChange={(e) => setParams({ projectId: e.target.value || null })}><option value="">All projects</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</NativeSelect>
        <NativeSelect value={params.get("assigneeId") ?? ""} onChange={(e) => setParams({ assigneeId: e.target.value || null, unassigned: null })}><option value="">Anyone</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</NativeSelect>
        <NativeSelect value={params.get("status") ?? ""} onChange={(e) => setParams({ status: e.target.value || null })}><option value="">Open statuses</option>{TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</NativeSelect>
        <NativeSelect value={params.get("priority") ?? ""} onChange={(e) => setParams({ priority: e.target.value || null })}><option value="">Any priority</option>{PRIORITIES.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}</NativeSelect>
        {params.size > 0 && <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setParams({}, true); }}><X className="size-3.5" /> Clear</Button>}
        <span className="ml-auto text-xs text-muted-foreground">{total} task{total === 1 ? "" : "s"}</span>
      </div>

      {selected.size > 0 && (
        <div className={cn("flex flex-wrap items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2 text-sm")}>
          <span className="font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}><UserPlus className="size-3.5" /> Assign</Button>
          <NativeSelect value="" onChange={(e) => { if (e.target.value) bulkStatus(e.target.value); }}><option value="">Change status…</option>{TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</NativeSelect>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <TaskTable tasks={tasks} showProject selectable selected={selected} onToggle={toggle} onToggleAll={toggleAll} onOpen={openTask} />
      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} onPick={(m) => bulkAssign(m?.member.id ?? null)} taskTitle={`${selected.size} tasks`} />
      <TaskSheet />
    </div>
  );
}
