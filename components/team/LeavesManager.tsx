"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/FormField";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/hooks/useApi";
import { fmtDate, todayStr } from "@/lib/format";

type Leave = { id: string; startDate: string; endDate: string; reason: string | null };

export function LeavesManager({ memberId, leaves }: { memberId: string; leaves: Leave[] }) {
  const router = useRouter();
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(todayStr());
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (start > end) { toast.error("Start date must be on or before end date"); return; }
    setBusy(true);
    try {
      await api(`/api/members/${memberId}/leaves`, { method: "POST", json: { startDate: start, endDate: end, reason: reason || null } });
      toast.success("Leave added");
      setReason("");
      router.refresh();
    } finally { setBusy(false); }
  }
  async function remove(id: string) {
    await api(`/api/members/${memberId}/leaves/${id}`, { method: "DELETE" });
    toast.success("Leave removed");
    router.refresh();
  }

  const today = todayStr();
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_280px]">
      <div>
        {leaves.length === 0 ? (
          <EmptyState icon={CalendarOff} title="No leave recorded" description="Leave reduces this member's capacity for that week." />
        ) : (
          <ul className="divide-y rounded-lg border">
            {leaves.map((l) => {
              const state = l.endDate < today ? "past" : l.startDate <= today ? "now" : "upcoming";
              return (
                <li key={l.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className={state === "now" ? "size-2 rounded-full bg-amber-500" : state === "upcoming" ? "size-2 rounded-full bg-blue-500" : "size-2 rounded-full bg-muted-foreground/40"} />
                  <span className="tabular-nums">{fmtDate(l.startDate, "d MMM yyyy")}{l.startDate !== l.endDate && ` → ${fmtDate(l.endDate, "d MMM yyyy")}`}</span>
                  <span className="flex-1 truncate text-muted-foreground">{l.reason}</span>
                  <span className="text-[11px] text-muted-foreground capitalize">{state}</span>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => remove(l.id)} aria-label="Remove leave"><Trash2 className="size-3.5" /></Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="space-y-3 rounded-lg border p-3">
        <div className="text-sm font-medium">Add leave</div>
        <FormField label="From" htmlFor="ls"><Input id="ls" type="date" value={start} onChange={(e) => { setStart(e.target.value); if (e.target.value > end) setEnd(e.target.value); }} /></FormField>
        <FormField label="To" htmlFor="le"><Input id="le" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></FormField>
        <FormField label="Reason" htmlFor="lr"><Input id="lr" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" /></FormField>
        <Button size="sm" className="w-full" onClick={add} disabled={busy}>{busy ? "Adding…" : "Add leave"}</Button>
      </div>
    </div>
  );
}
