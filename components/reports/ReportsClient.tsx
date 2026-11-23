"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Copy, Download } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvailabilityBadge, CapacityBar } from "@/components/shared/AvailabilityBadge";
import { HealthDot } from "@/components/shared/HealthDot";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { fmtDate, fmtHours } from "@/lib/format";
import { cn } from "@/lib/utils";
import { projectReportMarkdown, type WeeklyReport } from "@/lib/services/reports";

export function ReportsClient({ report, thisWeek }: { report: WeeklyReport; thisWeek: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const go = (ws: string) => { const n = new URLSearchParams(params.toString()); if (ws === thisWeek) n.delete("week"); else n.set("week", ws); router.push(n.size ? `${pathname}?${n}` : pathname); };
  const start = parseISO(report.weekStart);
  const open = report.projects.filter((r) => r.project.status !== "completed" && r.project.status !== "cancelled");
  const allMd = open.map((r) => projectReportMarkdown(r, report.weekStart, report.weekEnd)).join("\n\n— — —\n\n");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => go(format(subDays(start, 7), "yyyy-MM-dd"))} aria-label="Previous week"><ChevronLeft className="size-4" /></Button>
        <Input type="date" value={report.weekStart} onChange={(e) => e.target.value && go(e.target.value)} className="w-40" />
        <Button variant="outline" size="icon" onClick={() => go(format(addDays(start, 7), "yyyy-MM-dd"))} aria-label="Next week"><ChevronRight className="size-4" /></Button>
        <span className="text-sm text-muted-foreground">{fmtDate(report.weekStart, "d MMM")} → {fmtDate(report.weekEnd, "d MMM yyyy")}</span>
        {report.weekStart !== thisWeek && <Button variant="ghost" size="sm" onClick={() => go(thisWeek)}>This week</Button>}
        <div className="ml-auto flex flex-wrap gap-2">
          <CopyButton text={allMd} label="Copy all as Markdown" />
          <a href={`/api/export/tasks?includeDone=true`}><Button size="sm" variant="outline"><Download className="size-3.5" /> Tasks CSV</Button></a>
          <a href={`/api/export/daily-updates?from=${report.weekStart}&to=${report.weekEnd}`}><Button size="sm" variant="outline"><Download className="size-3.5" /> Updates CSV</Button></a>
        </div>
      </div>

      {open.length === 0 ? <EmptyState title="No open projects" /> : (
        <div className="grid gap-4 xl:grid-cols-2">
          {open.map((r) => (
            <section key={r.project.id} className="rounded-lg border bg-card">
              <header className="flex items-start justify-between gap-2 border-b px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/projects/${r.project.id}`} className="flex items-center gap-1.5 text-sm font-medium hover:underline"><HealthDot health={r.project.health} />{r.project.name}<StatusBadge status={r.project.status} /></Link>
                  <ProgressBar percent={r.progress.percent} className="mt-2 max-w-xs" />
                  <div className="mt-1 text-[11px] text-muted-foreground">{r.progress.doneTasks}/{r.progress.totalTasks} tasks · {fmtHours(r.hoursLogged)} logged this week{r.project.targetEndDate && ` · target ${fmtDate(r.project.targetEndDate, "d MMM")}`}</div>
                </div>
                <CopyButton text={projectReportMarkdown(r, report.weekStart, report.weekEnd)} label="Copy" />
              </header>
              <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-2">
                <List title={`Done this week · ${r.doneThisWeek.length}`} items={r.doneThisWeek.map((t) => t.title)} tone="text-emerald-700" />
                <List title={`In progress · ${r.inProgress.length}`} items={r.inProgress.map((t) => `${t.title}${t.status === "in_review" ? " (review)" : ""}`)} tone="text-blue-700" />
                {r.blocked.length > 0 && <List title={`Blocked · ${r.blocked.length}`} items={r.blocked.map((t) => t.title)} tone="text-red-700" />}
                {r.overdue.length > 0 && <List title={`Overdue · ${r.overdue.length}`} items={r.overdue.map((t) => `${t.title} (${fmtDate(t.dueDate)})`)} tone="text-red-700" />}
                {r.dueNextWeek.length > 0 && <List title={`Due next week · ${r.dueNextWeek.length}`} items={r.dueNextWeek.map((t) => `${t.title} (${fmtDate(t.dueDate)})`)} tone="text-muted-foreground" />}
              </div>
            </section>
          ))}
        </div>
      )}

      {report.blockers.length > 0 && (
        <section className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-red-700 dark:text-red-300"><AlertTriangle className="size-4" /> Blockers reported this week</div>
          <ul className="space-y-1 text-sm">{report.blockers.map((b, i) => <li key={i}><span className="text-muted-foreground">{fmtDate(b.date, "EEE d")}</span> · <span className="font-medium">{b.name}</span>: {b.blockers}</li>)}</ul>
        </section>
      )}

      <section className="rounded-lg border">
        <header className="border-b px-4 py-2 text-sm font-medium">Team utilisation · week of {fmtDate(report.weekStart, "d MMM")}</header>
        <ul className="divide-y">
          {report.team.map((m) => (
            <li key={m.member.id} className="flex items-center gap-3 px-4 py-2">
              <MemberAvatar name={m.member.name} color={m.member.avatarColor} size="sm" />
              <Link href={`/team/${m.member.id}`} className="w-36 truncate text-sm hover:underline">{m.member.name}</Link>
              <CapacityBar capacity={m.capacityHours} committed={m.committedHours} leave={m.leaveHours} className="flex-1" />
              <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{m.utilizationPercent}%</span>
              <AvailabilityBadge badge={m.badge} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function List({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <div className={cn("mb-1 text-xs font-medium", tone)}>{title}</div>
      {items.length === 0 ? <div className="text-xs text-muted-foreground">—</div> : <ul className="space-y-0.5 text-xs">{items.map((i, k) => <li key={k} className="truncate">• {i}</li>)}</ul>}
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); toast.success("Copied to clipboard"); setTimeout(() => setDone(false), 1500); } catch { toast.error("Clipboard blocked"); } }}>
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {label}
    </Button>
  );
}
