"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { api } from "@/lib/hooks/useApi";
import { CompleteProjectDialog } from "./CompleteProjectDialog";
import { ProjectForm, type ProjectFormInitial } from "./ProjectForm";

export function ProjectSettings({ project, openTaskCount }: { project: ProjectFormInitial & { id: string; name: string; status: string; health: string }; openTaskCount: number }) {
  const router = useRouter();
  const [archive, setArchive] = useState(false);
  const [del, setDel] = useState(false);
  const closed = project.status === "completed" || project.status === "cancelled";
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="rounded-lg border p-4"><ProjectForm initial={project} openTaskCount={openTaskCount} /></div>
      <div className="space-y-4">
        <section className="rounded-lg border p-4">
          <h3 className="mb-1 text-sm font-medium">Danger zone</h3>
          {!closed && <Button size="sm" variant="outline" className="mr-2" onClick={() => setArchive(true)}><Archive className="size-3.5" /> Mark completed</Button>}
          <Button size="sm" variant="destructive" onClick={() => setDel(true)}><Trash2 className="size-3.5" /> Delete</Button>
        </section>
      </div>
      <CompleteProjectDialog
        open={archive}
        onOpenChange={setArchive}
        openTaskCount={openTaskCount}
        onChoose={async (mark) => {
          const r = await api<{ closedTasks?: number }>(`/api/projects/${project.id}`, { method: "PATCH", json: { status: "completed", markOpenTasksDone: mark } });
          const n = r.closedTasks ?? 0;
          toast.success(n ? `Project completed · ${n} task${n === 1 ? "" : "s"} marked done` : "Project completed");
          router.refresh();
        }}
      />
      <ConfirmDialog open={del} onOpenChange={setDel} title={`Delete ${project.name}?`} description="Deletes the project and every task, milestone and note in it. This cannot be undone." confirmLabel="Delete project" destructive onConfirm={async () => { await api(`/api/projects/${project.id}?hard=true`, { method: "DELETE" }); toast.success("Project deleted"); router.push("/projects"); router.refresh(); }} />
    </div>
  );
}
