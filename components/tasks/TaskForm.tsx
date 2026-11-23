"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/FormField";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { AvailabilityBadge } from "@/components/shared/AvailabilityBadge";
import { PRIORITIES, TASK_STATUSES } from "@/lib/db/schema";
import { api } from "@/lib/hooks/useApi";
import { titleCase } from "@/lib/format";
import { STATUS_LABEL } from "@/components/shared/StatusBadge";
import { AssignDialog } from "./AssignDialog";
import type { MemberAvailability } from "@/lib/services/availability";

const schema = z.object({
  projectId: z.string().uuid("Pick a project"),
  milestoneId: z.string(),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().max(20000),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(PRIORITIES),
  estimatedHours: z.coerce.number().min(0).max(10000),
  dueDate: z.string(),
  tags: z.string().max(400),
});
type Values = z.output<typeof schema>;
type Input = z.input<typeof schema>;

export type ProjectOption = { id: string; name: string; milestones?: { id: string; name: string }[] };

export function TaskForm({ projects, defaultProjectId, defaultStatus, onDone }: { projects: ProjectOption[]; defaultProjectId?: string; defaultStatus?: string; onDone?: (id: string) => void }) {
  const router = useRouter();
  const [assignee, setAssignee] = useState<MemberAvailability | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [fetchedMs, setFetchedMs] = useState<{ projectId: string; items: { id: string; name: string }[] } | null>(null);
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<Input, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: defaultProjectId ?? projects[0]?.id ?? "",
      milestoneId: "",
      title: "",
      description: "",
      status: (defaultStatus as Input["status"]) ?? "todo",
      priority: "medium",
      estimatedHours: 0,
      dueDate: "",
      tags: "",
    },
  });
  const projectId = useWatch({ control, name: "projectId" });
  const estimated = useWatch({ control, name: "estimatedHours" });

  const staticMs = projects.find((x) => x.id === projectId)?.milestones;
  useEffect(() => {
    if (staticMs || !projectId) return;
    let cancelled = false;
    api<{ id: string; name: string }[]>(`/api/projects/${projectId}/milestones`, { silent: true })
      .then((items) => { if (!cancelled) setFetchedMs({ projectId, items }); })
      .catch(() => { if (!cancelled) setFetchedMs({ projectId, items: [] }); });
    return () => { cancelled = true; };
  }, [projectId, staticMs]);
  const milestones = staticMs ?? (fetchedMs?.projectId === projectId ? fetchedMs.items : []);

  async function onSubmit(v: Values) {
    const payload = {
      projectId: v.projectId,
      milestoneId: v.milestoneId || null,
      assigneeId: assignee?.member.id ?? null,
      title: v.title,
      description: v.description || null,
      status: v.status,
      priority: v.priority,
      estimatedHours: v.estimatedHours,
      dueDate: v.dueDate || null,
      tags: v.tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const saved = await api<{ id: string }>("/api/tasks", { method: "POST", json: payload });
    toast.success("Task created");
    router.refresh();
    onDone?.(saved.id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Title" htmlFor="ttitle" error={errors.title?.message} className="sm:col-span-2"><Input id="ttitle" autoFocus {...register("title")} /></FormField>
        <FormField label="Project" htmlFor="tproj" error={errors.projectId?.message}>
          <NativeSelect id="tproj" className="w-full" {...register("projectId")}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</NativeSelect>
        </FormField>
        <FormField label="Milestone" htmlFor="tms">
          <NativeSelect id="tms" className="w-full" {...register("milestoneId")}><option value="">None</option>{milestones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</NativeSelect>
        </FormField>
        <FormField label="Status" htmlFor="tstatus">
          <NativeSelect id="tstatus" className="w-full" {...register("status")}>{TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</NativeSelect>
        </FormField>
        <FormField label="Priority" htmlFor="tprio">
          <NativeSelect id="tprio" className="w-full" {...register("priority")}>{PRIORITIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</NativeSelect>
        </FormField>
        <FormField label="Estimate (hours)" htmlFor="test" error={errors.estimatedHours?.message}><Input id="test" type="number" step="0.5" min={0} {...register("estimatedHours")} /></FormField>
        <FormField label="Due date" htmlFor="tdue"><Input id="tdue" type="date" {...register("dueDate")} /></FormField>
        <FormField label="Assignee" className="sm:col-span-2">
          <button type="button" onClick={() => setAssignOpen(true)} className="flex h-8 w-full items-center gap-2 rounded-lg border border-input px-2.5 text-left text-sm hover:bg-muted/50">
            {assignee ? (<><MemberAvatar name={assignee.member.name} color={assignee.member.avatarColor} size="xs" /><span>{assignee.member.name}</span><AvailabilityBadge badge={assignee.badge} className="ml-auto" /></>) : <span className="text-muted-foreground">Unassigned · click to pick someone who is free</span>}
          </button>
        </FormField>
        <FormField label="Tags" htmlFor="ttags" hint="Comma-separated" className="sm:col-span-2"><Input id="ttags" {...register("tags")} /></FormField>
        <FormField label="Description" htmlFor="tdesc" className="sm:col-span-2"><Textarea id="tdesc" rows={3} {...register("description")} /></FormField>
      </div>
      <div className="flex justify-end"><Button type="submit" disabled={isSubmitting || projects.length === 0}>{isSubmitting ? "Creating…" : "Create task"}</Button></div>
      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} remainingHours={Number(estimated) || 0} currentAssigneeId={assignee?.member.id ?? null} onPick={setAssignee} />
    </form>
  );
}
