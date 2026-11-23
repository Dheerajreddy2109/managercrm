"use client";

import { ProjectPeople } from "./ProjectPeople";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Ban, LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AvatarStack } from "@/components/shared/MemberAvatar";
import { HealthDot } from "@/components/shared/HealthDot";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PROJECT_STATUSES } from "@/lib/db/schema";
import { fmtDate, titleCase } from "@/lib/format";
import { projectDisplay } from "@/lib/projectDisplay";
import type { listProjects } from "@/lib/services/projects";

type Row = Awaited<ReturnType<typeof listProjects>>[number];

export function ProjectsList({ projects }: { projects: Row[] }) {
  const [view, setView] = useState<"cards" | "table">("cards");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("open");
  const [health, setHealth] = useState("");

  const rows = projects.filter((p) => {
    if (status === "open" ? p.status === "completed" || p.status === "cancelled" : status ? p.status !== status : false) return false;
    if (health && p.health !== health) return false;
    if (q && !`${p.name} ${p.client ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).map((p) => ({ ...p, d: projectDisplay(p) }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} className="w-52 pl-7" />
        </div>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Open</option><option value="">All</option>
          {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </NativeSelect>
        <NativeSelect value={health} onChange={(e) => setHealth(e.target.value)}>
          <option value="">Any health</option><option value="green">Green</option><option value="amber">Amber</option><option value="red">Red</option>
        </NativeSelect>
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-2 text-xs text-muted-foreground">{rows.length}</span>
          <Button variant={view === "cards" ? "secondary" : "ghost"} size="icon" onClick={() => setView("cards")} aria-label="Cards"><LayoutGrid className="size-4" /></Button>
          <Button variant={view === "table" ? "secondary" : "ghost"} size="icon" onClick={() => setView("table")} aria-label="Table"><List className="size-4" /></Button>
        </div>
      </div>

      {rows.length === 0 ? <EmptyState title="No projects match" /> : view === "cards" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="group rounded-lg border bg-card p-3 hover:bg-muted/40">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5"><HealthDot health={p.health} /><span className="truncate text-sm font-medium group-hover:underline">{p.name}</span></div>
                  {p.client && <div className="truncate text-xs text-muted-foreground">{p.client}</div>}
                </div>
                <div className="flex items-center gap-1.5"><PriorityBadge priority={p.priority} /><StatusBadge status={p.status} /></div>
              </div>
              <ProgressBar percent={p.d.percent} className="mt-3" />
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{p.d.completed ? (p.d.openTasks ? `Completed · ${p.d.openTasks} task${p.d.openTasks === 1 ? "" : "s"} left open` : "Completed · all tasks done") : `${p.progress.doneTasks}/${p.progress.totalTasks} tasks`}</span>
                <span className="flex items-center gap-2">
                  {p.d.overdue > 0 && <span className="flex items-center gap-0.5 text-red-600"><AlertTriangle className="size-3" />{p.d.overdue}</span>}
                  {p.d.blocked > 0 && <span className="flex items-center gap-0.5 text-amber-600"><Ban className="size-3" />{p.d.blocked}</span>}
                  {p.targetEndDate && <span>→ {fmtDate(p.targetEndDate, "d MMM yy")}</span>}
                </span>
              </div>
              <ProjectPeople people={p.members} techStack={p.techStack} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Status</TableHead><TableHead className="w-44">Progress</TableHead><TableHead className="hidden md:table-cell">Team</TableHead><TableHead className="text-right">Overdue</TableHead><TableHead className="hidden sm:table-cell">Target</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><Link href={`/projects/${p.id}`} className="flex items-center gap-2 hover:underline"><HealthDot health={p.health} /><PriorityBadge priority={p.priority} /><span className="font-medium">{p.name}</span>{p.client && <span className="text-xs text-muted-foreground">{p.client}</span>}</Link></TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell><ProgressBar percent={p.d.percent} /></TableCell>
                  <TableCell className="hidden md:table-cell"><AvatarStack people={p.members} /></TableCell>
                  <TableCell className="text-right">{p.d.overdue > 0 ? <span className="text-red-600">{p.d.overdue}</span> : <span className="text-muted-foreground">0</span>}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{fmtDate(p.targetEndDate, "d MMM yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
