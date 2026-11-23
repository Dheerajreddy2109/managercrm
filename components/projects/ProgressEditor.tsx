"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { api } from "@/lib/hooks/useApi";

/** Project progress bar with an Edit button to set the % by hand. */
export function ProgressEditor({ projectId, percent, showLabel = true }: { projectId: string; percent: number; showLabel?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(percent);
  const [saving, setSaving] = useState(false);

  async function save() {
    const v = Math.min(100, Math.max(0, Math.round(value)));
    setSaving(true);
    try {
      await api(`/api/projects/${projectId}`, { method: "PATCH", json: { progressMethod: "manual", manualProgress: v } });
      toast.success(`Progress set to ${v}%`);
      setEditing(false);
      router.refresh();
    } finally { setSaving(false); }
  }

  if (!editing) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <ProgressBar percent={percent} label={showLabel} className="flex-1" />
        <Button variant="outline" size="xs" onClick={() => { setValue(percent); setEditing(true); }}><Pencil className="size-3" /> Edit %</Button>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => setValue(Number(e.target.value))} className="min-w-40 flex-1 accent-primary" aria-label="Progress" />
      <Input type="number" min={0} max={100} value={value} onChange={(e) => setValue(Number(e.target.value))} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} className="h-7 w-16 text-xs" autoFocus />
      <span className="text-xs">%</span>
      <Button size="xs" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      <Button size="xs" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
    </div>
  );
}
