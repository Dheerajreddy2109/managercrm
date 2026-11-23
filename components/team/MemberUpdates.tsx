import { fmtDate, fmtHours } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import type { getUpdatesForMember } from "@/lib/services/dailyUpdates";

type Row = Awaited<ReturnType<typeof getUpdatesForMember>>[number];
const MOOD = { great: "😀", ok: "🙂", struggling: "😟" } as const;

export function MemberUpdates({ updates }: { updates: Row[] }) {
  if (updates.length === 0) return <EmptyState title="No daily updates in the last 30 days" />;
  return (
    <ul className="space-y-2">
      {updates.map((u) => (
        <li key={u.id} className="rounded-lg border p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{fmtDate(u.date, "EEE, d MMM yyyy")}</span>
            <span className="flex items-center gap-2">{u.mood && <span title={u.mood}>{MOOD[u.mood]}</span>}<span>{fmtHours(u.hoursLogged)}</span></span>
          </div>
          {u.summary && <p className="mt-1 text-sm whitespace-pre-wrap">{u.summary}</p>}
          {u.blockers && <p className="mt-1 rounded bg-red-500/10 px-2 py-1 text-xs text-red-700 dark:text-red-300"><span className="font-medium">Blocked:</span> {u.blockers}</p>}
          {u.tasks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {u.tasks.map((t) => <span key={t.taskId} className="rounded border px-1.5 py-0.5 text-[11px]">{t.task.title} · {fmtHours(t.hours)}</span>)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
