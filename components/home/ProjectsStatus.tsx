"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { ProgressEditor } from "@/components/projects/ProgressEditor";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { getHome } from "@/lib/services/home";

type P = Awaited<ReturnType<typeof getHome>>["projects"][number];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Ongoing" },
  { key: "on_hold", label: "On hold" },
  { key: "planning", label: "Upcoming" },
  { key: "completed", label: "Completed" },
] as const;

export function ProjectsStatus({ projects }: { projects: P[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const [person, setPerson] = useState("");
  const people = [...new Map(projects.flatMap((p) => p.people.map((m) => [m.id, m.name] as const))).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const byPerson = person ? projects.filter((p) => p.people.some((m) => m.id === person)) : projects;
  const count = (k: string) => (k === "all" ? byPerson.length : byPerson.filter((p) => p.status === k).length);
  const needle = q.trim().toLowerCase();
  const shown = byPerson.filter(
    (p) => (filter === "all" || p.status === filter) && (!needle || p.name.toLowerCase().includes(needle) || p.people.some((m) => m.name.toLowerCase().includes(needle))),
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={cn("rounded-md border px-2.5 py-1 text-xs", filter === f.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
              {f.label} <span className="opacity-70">{count(f.key)}</span>
            </button>
          ))}
        </div>
        <NativeSelect value={person} onChange={(e) => setPerson(e.target.value)} className="h-8 text-xs" aria-label="Filter by employee">
          <option value="">All employees</option>
          {people.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </NativeSelect>
        <div className="relative ml-auto w-full sm:w-60">
          <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search project or person" className="h-8 pl-7 text-xs" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {shown.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No projects match.</p>}
        {shown.map((p) => (
          <div key={p.id} className="grid gap-2 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_280px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/projects/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                <StatusBadge status={p.status} />
                <PriorityBadge priority={p.priority} />
                <span className="text-xs text-muted-foreground">
                  {p.techStack.join(", ")}{p.targetEndDate && ` · Due ${fmtDate(p.targetEndDate, "d MMM yyyy")}`}
                </span>
              </div>
              {p.status === "on_hold" && (
                <p className="mt-1 text-xs whitespace-pre-wrap text-amber-700 dark:text-amber-400">
                  On hold: {p.holdReason || <span className="italic text-muted-foreground">no reason set — add it in Project → Settings</span>}
                </p>
              )}
              {p.description && <p className="mt-1 text-xs whitespace-pre-wrap">{p.description}</p>}
              <ul className="mt-1.5 space-y-0.5">
                {p.people.length === 0 && <li className="text-xs text-muted-foreground">No one assigned</li>}
                {p.people.map((m) => (
                  <li key={m.id} className="text-xs">
                    <Link href={`/team/${m.id}`} className="font-medium hover:underline">{m.name}</Link>
                    {(m.role || m.tech) && <span className="text-muted-foreground"> · {[m.role, m.tech].filter(Boolean).join(", ")}</span>}
                    {m.status && m.status !== p.status && <span className="text-muted-foreground"> · {m.status === "active" ? "ongoing" : m.status.replace("_", " ")}</span>}
                    {m.percent != null && <span className="text-muted-foreground"> · {m.percent}%</span>}
                    {m.notes && <span className="text-muted-foreground"> — {m.notes}</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{p.totalTasks ? `${p.doneTasks}/${p.totalTasks} tasks` : ""}</span>
                <span className="font-medium text-foreground tabular-nums">{p.percent}%</span>
              </div>
              <ProgressEditor projectId={p.id} percent={p.percent} showLabel={false} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
