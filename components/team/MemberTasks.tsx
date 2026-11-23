"use client";

import Link from "next/link";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge, STATUS_LABEL } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TASK_STATUSES } from "@/lib/db/schema";
import { dueLabel, fmtHours } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { listTasks } from "@/lib/services/tasks";

type Row = Awaited<ReturnType<typeof listTasks>>["items"][number];

export function MemberTasks({ tasks }: { tasks: Row[] }) {
  const [status, setStatus] = useState("open");
  const rows = tasks.filter((t) => (status === "open" ? t.status !== "done" : status === "all" ? true : t.status === status));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Open</option>
          <option value="all">All</option>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </NativeSelect>
        <span className="text-xs text-muted-foreground">{rows.length} task{rows.length === 1 ? "" : "s"}</span>
      </div>
      {rows.length === 0 ? <EmptyState title="No tasks" /> : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="hidden sm:table-cell">Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const due = dueLabel(t.dueDate, t.status === "done");
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/projects/${t.project.id}?task=${t.id}`} className="flex items-center gap-2 hover:underline">
                        <PriorityBadge priority={t.priority} /><span className="truncate">{t.title}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{t.project.name}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-muted-foreground">{fmtHours(t.actualHours)} / {fmtHours(t.estimatedHours)}</TableCell>
                    <TableCell className={cn("text-xs", due.tone === "danger" && "font-medium text-red-600", due.tone === "warn" && "text-amber-600", due.tone === "muted" && "text-muted-foreground")}>{due.text}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
