import Link from "next/link";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { fmtDate, titleCase } from "@/lib/format";
import type { getHome } from "@/lib/services/home";

type E = Awaited<ReturnType<typeof getHome>>["employees"][number];

export function EmployeeCard({ e }: { e: E }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <MemberAvatar name={e.name} color={e.avatarColor} size="sm" />
        <Link href={`/team/${e.id}`} className="font-medium hover:underline">{e.name}</Link>
        <span className="text-xs text-muted-foreground">{titleCase(e.role)}</span>
        {e.status === "on_leave" && <span className="ml-auto text-xs text-amber-600">On leave</span>}
      </div>
      {e.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">{e.skills.map((s) => <span key={s} className="rounded bg-muted px-1.5 py-px text-[10px]">{s}</span>)}</div>
      )}

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
        <dt className="text-muted-foreground">Tech stack</dt><dd>{e.skills.join(", ") || "—"}</dd>
        <dt className="text-muted-foreground">Device</dt><dd>{[e.device, e.deviceSpecs].filter(Boolean).join(" · ") || "—"}</dd>
        {e.deviceIssues && <><dt className="text-muted-foreground">Device issue</dt><dd className="text-amber-700 dark:text-amber-400">⚠ {e.deviceIssues}</dd></>}
        <dt className="text-muted-foreground">Available</dt>
        <dd>{e.availableFrom || e.availableUntil ? `${e.availableFrom ? `from ${fmtDate(e.availableFrom, "d MMM yyyy")}` : ""}${e.availableUntil ? ` until ${fmtDate(e.availableUntil, "d MMM yyyy")}` : ""}` : "—"}</dd>
      </dl>

      <h3 className="mt-3 mb-1 text-xs font-medium text-muted-foreground uppercase">Projects</h3>
      {e.projects.length === 0 ? <p className="text-xs text-muted-foreground">None</p> : (
        <ul className="divide-y rounded-md border">
          {e.projects.map((p) => (
            <li key={p.id} className="px-2.5 py-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <Link href={`/projects/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                {p.tech && <span className="text-[11px] text-muted-foreground">{p.tech}</span>}
                <span className="ml-auto flex items-center gap-1.5">
                  {p.percent != null && <span className="text-xs tabular-nums">{p.percent}%</span>}
                  {p.priority && <PriorityBadge priority={p.priority} />}
                  <StatusBadge status={p.status} />
                </span>
              </div>
              {(p.dueDate || p.notes) && (
                <p className="mt-0.5 text-xs whitespace-pre-wrap text-muted-foreground">
                  {p.dueDate && <span className="text-foreground">Due {fmtDate(p.dueDate, "d MMM yyyy")}{p.notes ? " · " : ""}</span>}{p.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-3 mb-1 text-xs font-medium text-muted-foreground uppercase">Tasks</h3>
      {e.openTasks.length === 0 ? <p className="text-xs text-muted-foreground">None</p> : (
        <ul className="space-y-2">
          {e.openTasks.map((t) => (
            <li key={t.id} className="rounded-md border px-2.5 py-2">
              <Link href={`/projects/${t.projectId}?task=${t.id}`} className="flex flex-wrap items-center gap-x-2 text-sm hover:underline">
                <span className="font-medium">{t.title}</span>
                <span className="text-xs text-muted-foreground">· {t.projectName}</span>
                <span className="ml-auto"><StatusBadge status={t.status} /></span>
              </Link>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {t.dueDate ? `Due ${fmtDate(t.dueDate, "d MMM yyyy")}` : "No due date"}
                {t.estimatedHours > 0 && ` · Est. ${t.estimatedHours}h`}
                {t.completedAt && ` · Done ${fmtDate(new Date(t.completedAt), "d MMM")}`}
              </p>
              {t.description && <p className="mt-1 text-xs whitespace-pre-wrap text-muted-foreground">{t.description}</p>}
              {t.checklist.length > 0 && (
                <ol className="mt-1 list-decimal pl-5 text-xs">
                  {t.checklist.map((c) => <li key={c.id} className={c.isDone ? "text-muted-foreground line-through" : ""}>{c.text}</li>)}
                </ol>
              )}
              {t.comments.map((c) => <p key={c.id} className="mt-1 text-xs text-amber-700 dark:text-amber-400">Note: {c.body}</p>)}
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-3 mb-1 text-xs font-medium text-muted-foreground uppercase">Daily updates (last 30 days)</h3>
      {e.updates.length === 0 ? <p className="text-xs text-muted-foreground">No updates</p> : (
        <ul className="space-y-2">
          {e.updates.map((u) => (
            <li key={u.id} className="text-sm">
              <span className="text-xs font-medium">{fmtDate(u.date, "EEE d MMM")}</span>
              {u.summary && <p className="whitespace-pre-wrap text-muted-foreground">{u.summary}</p>}
              {u.tasks.length > 0 && <p className="text-xs text-muted-foreground">Tasks: {u.tasks.map((t) => t.title).join(", ")}</p>}
              {u.blockers && <p className="text-xs text-red-600">Blocker: {u.blockers}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
