"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Gavel, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/hooks/useApi";
import { fmtAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProjectNote } from "@/lib/db/schema";

const ICON = { note: StickyNote, risk: AlertTriangle, decision: Gavel } as const;
const SEV = { low: "bg-slate-500/10 text-slate-700", medium: "bg-amber-500/10 text-amber-700", high: "bg-red-500/10 text-red-700" } as const;

export function NotesPanel({ projectId, notes }: { projectId: string; notes: ProjectNote[] }) {
  const router = useRouter();
  const [type, setType] = useState<"note" | "risk" | "decision">("note");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [body, setBody] = useState("");
  const [filter, setFilter] = useState("");
  async function add() {
    if (!body.trim()) return;
    await api(`/api/projects/${projectId}/notes`, { method: "POST", json: { type, body: body.trim(), severity: type === "risk" ? severity : null } });
    toast.success(`${type[0].toUpperCase()}${type.slice(1)} added`); setBody(""); router.refresh();
  }
  const rows = notes.filter((n) => !filter || n.type === filter);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3">
        <div className="mb-2 flex items-center gap-2">
          <NativeSelect value={type} onChange={(e) => setType(e.target.value as typeof type)}><option value="note">Note</option><option value="risk">Risk</option><option value="decision">Decision</option></NativeSelect>
          {type === "risk" && <NativeSelect value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></NativeSelect>}
        </div>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder={type === "risk" ? "What could go wrong, and the impact…" : type === "decision" ? "What was decided and why…" : "Note…"} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(); }} />
        <div className="mt-2 flex justify-end"><Button size="sm" onClick={add} disabled={!body.trim()}>Add</Button></div>
      </div>
      <div className="flex items-center gap-2">
        <NativeSelect value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All</option><option value="risk">Risks</option><option value="decision">Decisions</option><option value="note">Notes</option></NativeSelect>
        <span className="text-xs text-muted-foreground">{rows.length}</span>
      </div>
      {rows.length === 0 ? <EmptyState title="Nothing here yet" /> : (
        <ul className="space-y-2">
          {rows.map((n) => { const Icon = ICON[n.type]; return (
            <li key={n.id} className="group flex gap-3 rounded-lg border p-3">
              <Icon className={cn("mt-0.5 size-4 shrink-0", n.type === "risk" ? "text-red-600" : n.type === "decision" ? "text-violet-600" : "text-muted-foreground")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground capitalize">{n.type}</span>
                  {n.severity && <span className={cn("rounded px-1.5 py-0.5 font-medium capitalize", SEV[n.severity])}>{n.severity}</span>}
                  <span>{fmtAgo(n.createdAt)}</span>
                  <button type="button" className="ml-auto opacity-0 group-hover:opacity-100" onClick={async () => { await api(`/api/projects/${projectId}/notes/${n.id}`, { method: "DELETE" }); router.refresh(); }} aria-label="Delete"><Trash2 className="size-3.5" /></button>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{n.body}</p>
              </div>
            </li>
          ); })}
        </ul>
      )}
    </div>
  );
}
