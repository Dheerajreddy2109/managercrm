"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock, Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { fmtDate, fmtHours } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { getUpdatesForDate, getUpdatesRange } from "@/lib/services/dailyUpdates";
import { UpdateForm } from "./UpdateForm";

type Day = Awaited<ReturnType<typeof getUpdatesForDate>>;
type Range = Awaited<ReturnType<typeof getUpdatesRange>>;
const MOOD = { great: "😀", ok: "🙂", struggling: "😟" } as const;

export function DailyUpdatesClient({ day, week, today, initialMember }: { day: Day; week: Range; today: string; initialMember?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [selected, setSelected] = useState<string | null>(initialMember ?? day.entries.find((e) => !e.update && !e.onLeave)?.member.id ?? day.entries[0]?.member.id ?? null);
  const go = (date: string) => { const n = new URLSearchParams(params.toString()); if (date === today) n.delete("date"); else n.set("date", date); n.delete("member"); router.push(n.size ? `${pathname}?${n}` : pathname); };
  const d = parseISO(day.date);
  const entry = day.entries.find((e) => e.member.id === selected) ?? null;
  const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(parseISO(week.from), i), "yyyy-MM-dd"));
  const byDate = new Map(week.days.map((x) => [x.date, x]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => go(format(subDays(d, 1), "yyyy-MM-dd"))} aria-label="Previous day"><ChevronLeft className="size-4" /></Button>
        <Input type="date" value={day.date} onChange={(e) => e.target.value && go(e.target.value)} className="w-40" />
        <Button variant="outline" size="icon" onClick={() => go(format(addDays(d, 1), "yyyy-MM-dd"))} aria-label="Next day"><ChevronRight className="size-4" /></Button>
        {day.date !== today && <Button variant="ghost" size="sm" onClick={() => go(today)}>Today</Button>}
        <span className="ml-auto text-sm text-muted-foreground"><span className="font-medium text-foreground">{day.updatedCount}</span> updated · <span className={cn(day.missingCount > 0 && "font-medium text-amber-600")}>{day.missingCount}</span> missing · {day.onLeaveCount} on leave</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((wd) => {
          const r = byDate.get(wd); const weekend = [0, 6].includes(parseISO(wd).getDay());
          const ratio = week.activeMembers ? (r?.updated ?? 0) / week.activeMembers : 0;
          return (
            <button key={wd} type="button" onClick={() => go(wd)} className={cn("rounded-md border px-1 py-1.5 text-center text-[11px] hover:bg-muted/50", wd === day.date && "ring-1 ring-primary", weekend && "opacity-50")}>
              <div className="font-medium">{fmtDate(wd, "EEE")}</div>
              <div className="text-muted-foreground">{fmtDate(wd, "d")}</div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted"><div className={cn("h-full", ratio >= 1 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${Math.min(ratio * 100, 100)}%` }} /></div>
              <div className="mt-0.5 tabular-nums">{r?.updated ?? 0}/{week.activeMembers}{r?.withBlockers ? <span className="text-red-600"> !</span> : null}</div>
            </button>
          );
        })}
      </div>

      {day.blockers.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-red-700 dark:text-red-300"><AlertTriangle className="size-4" /> Blockers {fmtDate(day.date, "d MMM")}</div>
          <ul className="space-y-1 text-sm">
            {day.blockers.map((b) => (
              <li key={b.member.id} className="flex gap-2"><button type="button" onClick={() => setSelected(b.member.id)} className="shrink-0 font-medium hover:underline">{b.member.name}:</button><span className="flex-1">{b.blockers}{b.tasks.length > 0 && <span className="text-muted-foreground"> · {b.tasks.map((t) => t.title).join(", ")}</span>}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <ul className="space-y-1">
          {day.entries.map((e) => (
            <li key={e.member.id}>
              <button type="button" onClick={() => setSelected(e.member.id)} className={cn("flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left hover:bg-muted/50", selected === e.member.id && "bg-primary/5 ring-1 ring-primary/40")}>
                <MemberAvatar name={e.member.name} color={e.member.avatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm"><span className="truncate">{e.member.name}</span>{e.update?.mood && <span className="text-xs">{MOOD[e.update.mood]}</span>}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{e.update ? e.update.summary || "(no summary)" : e.onLeave ? "On leave" : "No update yet"}</div>
                </div>
                {e.update ? <span className="flex items-center gap-1 text-[11px] text-emerald-600"><Check className="size-3.5" />{fmtHours(e.update.hoursLogged)}</span> : e.onLeave ? <Palmtree className="size-3.5 text-slate-500" /> : <Clock className="size-3.5 text-amber-500" />}
                {e.update?.blockers && <AlertTriangle className="size-3.5 text-red-600" />}
              </button>
            </li>
          ))}
        </ul>
        <div>{entry ? <UpdateForm key={`${entry.member.id}-${day.date}-${entry.update?.updatedAt ?? "new"}`} entry={entry} date={day.date} /> : <p className="text-sm text-muted-foreground">Select a member.</p>}</div>
      </div>
    </div>
  );
}
