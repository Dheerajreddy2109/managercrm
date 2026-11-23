"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/FormField";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/hooks/useApi";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { getUpdatesForDate } from "@/lib/services/dailyUpdates";

type Entry = Awaited<ReturnType<typeof getUpdatesForDate>>["entries"][number];
type OpenTask = { id: string; title: string; status: string; project: { id: string; name: string } };
const MOODS = [{ v: "great", e: "😀", l: "Great" }, { v: "ok", e: "🙂", l: "OK" }, { v: "struggling", e: "😟", l: "Struggling" }] as const;

export function UpdateForm({ entry, date, onSaved }: { entry: Entry; date: string; onSaved?: () => void }) {
  const router = useRouter();
  const u = entry.update;
  const [summary, setSummary] = useState(u?.summary ?? "");
  const [blockers, setBlockers] = useState(u?.blockers ?? "");
  const [mood, setMood] = useState<string>(u?.mood ?? "");
  const [hoursOverride, setHoursOverride] = useState<string>("");
  const [taskHours, setTaskHours] = useState<Record<string, number>>(() => Object.fromEntries((u?.tasks ?? []).map((t) => [t.taskId, t.hours])));
  const [openTasks, setOpenTasks] = useState<OpenTask[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ items: OpenTask[] }>(`/api/tasks?assigneeId=${entry.member.id}&limit=200`, { silent: true }).then((d) => { if (!cancelled) setOpenTasks(d.items); }).catch(() => { if (!cancelled) setOpenTasks([]); });
    return () => { cancelled = true; };
  }, [entry.member.id]);

  // Include tasks already linked to this update even if they're now done.
  const taskList = useMemo(() => {
    const list = [...(openTasks ?? [])];
    for (const t of u?.tasks ?? []) if (!list.some((x) => x.id === t.taskId)) list.push({ id: t.taskId, title: t.task.title, status: t.task.status, project: { id: t.task.projectId, name: "" } });
    return list;
  }, [openTasks, u]);

  const sum = Object.values(taskHours).reduce((s, h) => s + (h || 0), 0);
  const hours = hoursOverride === "" ? sum : Number(hoursOverride);

  async function save() {
    setBusy(true);
    try {
      await api("/api/daily-updates", {
        method: "POST",
        json: {
          memberId: entry.member.id, date, summary, blockers: blockers || null, mood: mood || null,
          hoursLogged: hoursOverride === "" ? undefined : hours,
          tasks: Object.entries(taskHours).filter(([, h]) => h > 0).map(([taskId, h]) => ({ taskId, hours: h })),
        },
      });
      toast.success(`Update saved for ${entry.member.name}`);
      router.refresh(); onSaved?.();
    } finally { setBusy(false); }
  }
  async function remove() {
    if (!u) return;
    await api(`/api/daily-updates/${u.id}`, { method: "DELETE" });
    toast.success("Update removed"); router.refresh(); onSaved?.();
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <MemberAvatar name={entry.member.name} color={entry.member.avatarColor} />
        <div><div className="text-sm font-medium">{entry.member.name}</div><div className="text-xs text-muted-foreground">{fmtDate(date, "EEE, d MMM yyyy")}{u && " · editing"}</div></div>
        <div className="ml-auto flex gap-1">
          {MOODS.map((m) => <button key={m.v} type="button" title={m.l} onClick={() => setMood(mood === m.v ? "" : m.v)} className={cn("rounded-md border px-2 py-1 text-base", mood === m.v ? "border-primary bg-primary/10" : "opacity-60 hover:opacity-100")}>{m.e}</button>)}
        </div>
      </div>

      <FormField label="What did they work on?" htmlFor="du-summary"><Textarea id="du-summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Short summary of the day" /></FormField>
      <FormField label="Blockers" htmlFor="du-block" hint="Shown in the red banner and the weekly report"><Textarea id="du-block" rows={2} value={blockers} onChange={(e) => setBlockers(e.target.value)} placeholder="Anything blocking them? Leave empty if not." className={cn(blockers && "border-red-500/40")} /></FormField>

      <div>
        <div className="mb-1 text-sm font-medium">Tasks worked on</div>
        <p className="mb-2 text-xs text-muted-foreground">Hours here are logged against each task&apos;s actual hours.</p>
        {openTasks === null ? <p className="text-xs text-muted-foreground">Loading tasks…</p> : taskList.length === 0 ? <p className="text-xs text-muted-foreground">No open tasks assigned to {entry.member.name}.</p> : (
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
            {taskList.map((t) => {
              const on = t.id in taskHours;
              return (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={on} onCheckedChange={(v) => setTaskHours((th) => { const n = { ...th }; if (v === true) n[t.id] = n[t.id] ?? 1; else delete n[t.id]; return n; })} />
                  <span className="flex-1 truncate">{t.title}</span>
                  {t.project.name && <span className="hidden text-[11px] text-muted-foreground sm:inline">{t.project.name}</span>}
                  <StatusBadge status={t.status} />
                  <Input type="number" step="0.5" min={0} value={on ? taskHours[t.id] : ""} disabled={!on} onChange={(e) => setTaskHours((th) => ({ ...th, [t.id]: Number(e.target.value) }))} className="h-7 w-16 text-xs" placeholder="h" />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <FormField label="Hours logged" htmlFor="du-hours" hint={hoursOverride === "" ? "Auto from tasks" : "Manual"}><Input id="du-hours" type="number" step="0.5" min={0} value={hoursOverride === "" ? sum : hoursOverride} onChange={(e) => setHoursOverride(e.target.value)} className="w-28" /></FormField>
        {hoursOverride !== "" && <Button variant="ghost" size="xs" onClick={() => setHoursOverride("")}>Use task total</Button>}
        <div className="ml-auto flex gap-2">
          {u && <Button variant="ghost" size="sm" className="text-destructive" onClick={remove}><Trash2 className="size-3.5" /> Remove</Button>}
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : u ? "Save changes" : "Post update"}</Button>
        </div>
      </div>
    </div>
  );
}
