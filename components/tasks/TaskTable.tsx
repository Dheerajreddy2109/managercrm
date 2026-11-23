"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { STATUS_LABEL } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PRIORITIES, TASK_STATUSES } from "@/lib/db/schema";
import { api } from "@/lib/hooks/useApi";
import { dueLabel, fmtHours, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AssigneeButton } from "./AssigneeButton";
import type { BoardTask } from "@/components/projects/KanbanBoard";

export function TaskTable({ tasks, showProject, selectable, selected, onToggle, onToggleAll, onOpen }: {
  tasks: BoardTask[]; showProject?: boolean; selectable?: boolean; selected?: Set<string>; onToggle?: (id: string) => void; onToggleAll?: () => void; onOpen: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  if (tasks.length === 0) return <EmptyState title="No tasks match" />;
  const allSel = selectable && selected && tasks.length > 0 && tasks.every((t) => selected.has(t.id));

  async function changeStatus(t: BoardTask, status: string) {
    setPending(t.id);
    try { await api(`/api/tasks/${t.id}/move`, { method: "POST", json: { status } }); toast.success(`Moved to ${STATUS_LABEL[status]}`); router.refresh(); } finally { setPending(null); }
  }
  async function changePriority(t: BoardTask, priority: string) {
    setPending(t.id);
    try { await api(`/api/tasks/${t.id}`, { method: "PATCH", json: { priority } }); router.refresh(); } finally { setPending(null); }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && <TableHead className="w-8"><Checkbox checked={!!allSel} onCheckedChange={onToggleAll} aria-label="Select all" /></TableHead>}
            <TableHead>Task</TableHead>
            {showProject && <TableHead className="hidden md:table-cell">Project</TableHead>}
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="hidden w-28 sm:table-cell">Priority</TableHead>
            <TableHead className="w-12">Who</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Hours</TableHead>
            <TableHead className="w-24">Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => {
            const due = dueLabel(t.dueDate, t.status === "done");
            return (
              <TableRow key={t.id} className={cn(pending === t.id && "opacity-60", selected?.has(t.id) && "bg-primary/5")}>
                {selectable && <TableCell><Checkbox checked={!!selected?.has(t.id)} onCheckedChange={() => onToggle?.(t.id)} aria-label="Select" /></TableCell>}
                <TableCell>
                  <button type="button" onClick={() => onOpen(t.id)} className="flex max-w-full items-center gap-2 text-left hover:underline">
                    <span className="truncate">{t.title}</span>
                    {t.checklist.total > 0 && <span className="text-[11px] text-muted-foreground">{t.checklist.done}/{t.checklist.total}</span>}
                  </button>
                  {t.tags.length > 0 && <div className="mt-0.5 flex gap-1">{t.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded bg-muted px-1 text-[10px]">{tag}</span>)}</div>}
                </TableCell>
                {showProject && <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{t.project.name}</TableCell>}
                <TableCell>
                  <NativeSelect value={t.status} onChange={(e) => changeStatus(t, e.target.value)} className="w-full text-xs">{TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</NativeSelect>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="flex items-center gap-1"><PriorityBadge priority={t.priority} />
                    <NativeSelect value={t.priority} onChange={(e) => changePriority(t, e.target.value)} className="w-full text-xs">{PRIORITIES.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}</NativeSelect>
                  </span>
                </TableCell>
                <TableCell><AssigneeButton task={t} assignee={t.assignee} size="sm" /></TableCell>
                <TableCell className="hidden text-right text-xs tabular-nums text-muted-foreground lg:table-cell">{fmtHours(t.actualHours)} / {fmtHours(t.estimatedHours)}</TableCell>
                <TableCell className={cn("text-xs", due.tone === "danger" && "font-medium text-red-600", due.tone === "warn" && "text-amber-600", due.tone === "muted" && "text-muted-foreground")}>{due.text}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
