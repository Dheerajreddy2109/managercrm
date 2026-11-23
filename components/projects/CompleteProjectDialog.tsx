"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Asked whenever a project is being marked Completed: what happens to tasks that are still open? */
export function CompleteProjectDialog({ open, onOpenChange, openTaskCount, onChoose }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  openTaskCount: number;
  onChoose: (markOpenTasksDone: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState<"done" | "keep" | null>(null);
  const n = openTaskCount;
  const run = async (mark: boolean) => {
    setBusy(mark ? "done" : "keep");
    try { await onChoose(mark); onOpenChange(false); } finally { setBusy(null); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete this project?</DialogTitle>
          <DialogDescription>
            {n > 0 ? `${n} task${n === 1 ? " is" : "s are"} still open. Should ${n === 1 ? "it" : "they"} be marked Done?` : "All tasks are done."}
          </DialogDescription>
        </DialogHeader>
        {n > 0 && (
          <p className="text-sm text-muted-foreground">
            Marking them Done clears them from task lists and team workload. Leaving them open keeps a record of what was not finished.
            Either way the project shows as 100% complete.
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={!!busy}>Cancel</Button>
          {n > 0 && <Button variant="outline" onClick={() => run(false)} disabled={!!busy}>{busy === "keep" ? "Completing…" : "Leave tasks open"}</Button>}
          <Button onClick={() => run(n > 0)} disabled={!!busy}>{busy === "done" ? "Completing…" : n > 0 ? `Mark ${n} done & complete` : "Complete project"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
