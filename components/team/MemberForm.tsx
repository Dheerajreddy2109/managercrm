"use client";

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
import { MEMBER_ROLES } from "@/lib/db/schema";
import { api } from "@/lib/hooks/useApi";
import { titleCase } from "@/lib/format";

const COLORS = ["#6366f1", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16", "#f97316"];

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Invalid email").max(200).or(z.literal("")),
  role: z.enum(MEMBER_ROLES),
  skills: z.string().max(600),
  weeklyCapacityHours: z.coerce.number().int().min(0).max(80),
  status: z.enum(["active", "on_leave", "inactive"]),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  notes: z.string().max(5000),
  device: z.string().max(1000),
  deviceSpecs: z.string().max(1000),
  deviceIssues: z.string().max(1000),
  availableFrom: z.string().max(1000),
  availableUntil: z.string().max(1000),
});
type Values = z.output<typeof schema>;
type Input = z.input<typeof schema>;

export type MemberFormInitial = Partial<{
  id: string; name: string; email: string | null; role: string; skills: string[]; weeklyCapacityHours: number; status: string; avatarColor: string; notes: string | null;
  device: string | null; deviceSpecs: string | null; deviceIssues: string | null; availableFrom: string | null; availableUntil: string | null;
}>;

export function MemberForm({ initial, onDone }: { initial?: MemberFormInitial; onDone?: (id: string) => void }) {
  const router = useRouter();
  const editing = !!initial?.id;
  const form = useForm<Input, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      role: (initial?.role as Input["role"]) ?? "other",
      skills: initial?.skills?.join(", ") ?? "",
      weeklyCapacityHours: initial?.weeklyCapacityHours ?? 40,
      status: (initial?.status as Input["status"]) ?? "active",
      avatarColor: initial?.avatarColor ?? COLORS[(initial?.name?.length ?? 0) % COLORS.length],
      notes: initial?.notes ?? "",
      device: initial?.device ?? "",
      deviceSpecs: initial?.deviceSpecs ?? "",
      deviceIssues: initial?.deviceIssues ?? "",
      availableFrom: initial?.availableFrom ?? "",
      availableUntil: initial?.availableUntil ?? "",
    },
  });
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, control } = form;
  const color = useWatch({ control, name: "avatarColor" });

  async function onSubmit(v: Values) {
    const payload = {
      name: v.name,
      email: v.email || null,
      role: v.role,
      skills: v.skills.split(",").map((s) => s.trim()).filter(Boolean),
      weeklyCapacityHours: v.weeklyCapacityHours,
      status: v.status,
      avatarColor: v.avatarColor,
      notes: v.notes || null,
      device: v.device || null,
      deviceSpecs: v.deviceSpecs || null,
      deviceIssues: v.deviceIssues || null,
      availableFrom: v.availableFrom || null,
      availableUntil: v.availableUntil || null,
    };
    const saved = editing
      ? await api<{ id: string }>(`/api/members/${initial!.id}`, { method: "PATCH", json: payload })
      : await api<{ id: string }>("/api/members", { method: "POST", json: payload });
    toast.success(editing ? "Member updated" : "Member added");
    router.refresh();
    onDone?.(saved.id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor="name" error={errors.name?.message} className="sm:col-span-2">
          <Input id="name" autoFocus {...register("name")} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </FormField>
        <FormField label="Role" htmlFor="role">
          <NativeSelect id="role" className="w-full" {...register("role")}>
            {MEMBER_ROLES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
          </NativeSelect>
        </FormField>
        <FormField label="Weekly capacity (hours)" htmlFor="cap" error={errors.weeklyCapacityHours?.message}>
          <Input id="cap" type="number" min={0} max={80} {...register("weeklyCapacityHours")} />
        </FormField>
        <FormField label="Status" htmlFor="status">
          <NativeSelect id="status" className="w-full" {...register("status")}>
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
            <option value="inactive">Inactive</option>
          </NativeSelect>
        </FormField>
        <FormField label="Skills" htmlFor="skills" hint="Comma-separated, e.g. react, node, aws" className="sm:col-span-2">
          <Input id="skills" {...register("skills")} />
        </FormField>
        <FormField label="Avatar colour" className="sm:col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setValue("avatarColor", c)} className="size-6 rounded-full ring-offset-2 ring-offset-background" style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : undefined }} aria-label={c} />
            ))}
          </div>
        </FormField>
        <FormField label="Device" htmlFor="device">
          <Input id="device" placeholder="e.g. Dell" {...register("device")} />
        </FormField>
        <FormField label="Specs" htmlFor="deviceSpecs">
          <Input id="deviceSpecs" placeholder="e.g. i5, 16GB RAM" {...register("deviceSpecs")} />
        </FormField>
        <FormField label="Device issues" htmlFor="deviceIssues" className="sm:col-span-2">
          <Input id="deviceIssues" placeholder="e.g. Hangs, not working properly" {...register("deviceIssues")} />
        </FormField>
        <FormField label="Available from" htmlFor="availableFrom">
          <Input id="availableFrom" type="date" {...register("availableFrom")} />
        </FormField>
        <FormField label="Available until" htmlFor="availableUntil">
          <Input id="availableUntil" type="date" {...register("availableUntil")} />
        </FormField>
        <FormField label="Notes" htmlFor="notes" className="sm:col-span-2">
          <Textarea id="notes" rows={3} {...register("notes")} />
        </FormField>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : editing ? "Save changes" : "Add member"}</Button>
      </div>
    </form>
  );
}
