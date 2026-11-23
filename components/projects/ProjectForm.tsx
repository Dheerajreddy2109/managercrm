"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/FormField";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { PRIORITIES, PROJECT_STATUSES } from "@/lib/db/schema";
import { api } from "@/lib/hooks/useApi";
import { titleCase } from "@/lib/format";
import { CompleteProjectDialog } from "./CompleteProjectDialog";

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    client: z.string().trim().max(160),
    description: z.string().max(10000),
    status: z.enum(PROJECT_STATUSES),
    priority: z.enum(PRIORITIES),
    progressMethod: z.enum(["manual", "tasks", "hours"]),
    manualProgress: z.coerce.number().int().min(0, "0–100").max(100, "0–100"),
    holdReason: z.string().max(1000),
    health: z.enum(["green", "amber", "red"]),
    startDate: z.string(),
    targetEndDate: z.string(),
    techStack: z.string().max(600),
  })
  .refine((v) => !v.startDate || !v.targetEndDate || v.startDate <= v.targetEndDate, { message: "Target end must be after start", path: ["targetEndDate"] });
type Values = z.infer<typeof schema>;

export type ProjectFormInitial = Partial<{
  id: string; name: string; client: string | null; description: string | null; status: string; priority: string; health: string; progressMethod: string; manualProgress: number; holdReason: string | null;
  startDate: string | null; targetEndDate: string | null; techStack: string[];
}>;

export function ProjectForm({ initial, onDone, openTaskCount = 0 }: { initial?: ProjectFormInitial; onDone?: (id: string) => void; openTaskCount?: number }) {
  const router = useRouter();
  const editing = !!initial?.id;
  const [pending, setPending] = useState<Record<string, unknown> | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      client: initial?.client ?? "",
      description: initial?.description ?? "",
      status: (initial?.status as Values["status"]) ?? "planning",
      priority: (initial?.priority as Values["priority"]) ?? "medium",
      progressMethod: (initial?.progressMethod as Values["progressMethod"]) ?? "manual",
      manualProgress: initial?.manualProgress ?? 0,
      holdReason: initial?.holdReason ?? "",
      health: (initial?.health as Values["health"]) ?? "green",
      startDate: initial?.startDate ?? "",
      targetEndDate: initial?.targetEndDate ?? "",
      techStack: initial?.techStack?.join(", ") ?? "",
    },
  });

  async function onSubmit(v: Values) {
    const payload = {
      name: v.name,
      client: v.client || null,
      description: v.description || null,
      status: v.status,
      priority: v.priority,
      progressMethod: v.progressMethod,
      manualProgress: v.manualProgress,
      holdReason: v.holdReason || null,
      health: v.health,
      startDate: v.startDate || null,
      targetEndDate: v.targetEndDate || null,
      techStack: v.techStack.split(",").map((s) => s.trim()).filter(Boolean),
    };
    // Changing status to Completed asks what to do with open tasks first.
    if (editing && payload.status === "completed" && initial?.status !== "completed") {
      setPending(payload);
      return;
    }
    await save(payload);
  }

  async function save(payload: Record<string, unknown>, markOpenTasksDone?: boolean) {
    const saved = editing
      ? await api<{ id: string; closedTasks?: number }>(`/api/projects/${initial!.id}`, { method: "PATCH", json: { ...payload, markOpenTasksDone } })
      : await api<{ id: string }>("/api/projects", { method: "POST", json: payload });
    const closed = "closedTasks" in saved ? saved.closedTasks ?? 0 : 0;
    toast.success(editing ? (closed ? `Project completed · ${closed} task${closed === 1 ? "" : "s"} marked done` : "Project updated") : "Project created");
    router.refresh();
    onDone?.(saved.id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor="pname" error={errors.name?.message} className="sm:col-span-2"><Input id="pname" autoFocus {...register("name")} /></FormField>
        <FormField label="Client" htmlFor="pclient"><Input id="pclient" {...register("client")} /></FormField>
        <FormField label="Status" htmlFor="pstatus">
          <NativeSelect id="pstatus" className="w-full" {...register("status")}>{PROJECT_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</NativeSelect>
        </FormField>
        <FormField label="Priority" htmlFor="pprio">
          <NativeSelect id="pprio" className="w-full" {...register("priority")}>{PRIORITIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</NativeSelect>
        </FormField>
        <FormField label="Progress method" htmlFor="pmethod">
          <NativeSelect id="pmethod" className="w-full" {...register("progressMethod")}><option value="manual">Manual · I enter the %</option><option value="tasks">All tasks · done ÷ total tasks</option><option value="hours">Hours · done hours ÷ total hours</option></NativeSelect>
        </FormField>
        <FormField label="Progress %" htmlFor="pmanual" error={errors.manualProgress?.message} hint="Used when method is Manual">
          <Input id="pmanual" type="number" min={0} max={100} {...register("manualProgress")} />
        </FormField>
        <FormField label="On-hold reason" htmlFor="phold" className="sm:col-span-2" hint="Shown when status is On hold">
          <Input id="phold" placeholder="e.g. Waiting for client feedback" {...register("holdReason")} />
        </FormField>
        <FormField label="Health" htmlFor="phealth">
          <NativeSelect id="phealth" className="w-full" {...register("health")}><option value="green">Green · on track</option><option value="amber">Amber · at risk</option><option value="red">Red · off track</option></NativeSelect>
        </FormField>
        <FormField label="Start date" htmlFor="pstart"><Input id="pstart" type="date" {...register("startDate")} /></FormField>
        <FormField label="Target end date" htmlFor="pend" error={errors.targetEndDate?.message}><Input id="pend" type="date" {...register("targetEndDate")} /></FormField>
        <FormField label="Tech stack" htmlFor="ptech" hint="Comma-separated" className="sm:col-span-2"><Input id="ptech" {...register("techStack")} /></FormField>
        <FormField label="Description" htmlFor="pdesc" className="sm:col-span-2"><Textarea id="pdesc" rows={3} {...register("description")} /></FormField>
      </div>
      <div className="flex justify-end"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : editing ? "Save changes" : "Create project"}</Button></div>
      <CompleteProjectDialog
        open={!!pending}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        openTaskCount={openTaskCount}
        onChoose={async (mark) => { if (pending) await save(pending, mark); }}
      />
    </form>
  );
}
