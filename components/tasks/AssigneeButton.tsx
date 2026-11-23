"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { AssignDialog, type AssignResult } from "./AssignDialog";
import { cn } from "@/lib/utils";

/** Avatar/"Assign" chip that opens the AssignDialog for a task. */
export function AssigneeButton({ task, assignee, size = "sm", showName = false, onAssigned, className, children }: {
  task: { id: string; title: string; estimatedHours: number; actualHours: number };
  assignee: { id: string; name: string; avatarColor?: string | null } | null;
  size?: "xs" | "sm" | "md";
  showName?: boolean;
  onAssigned?: (r: AssignResult) => void;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={cn("inline-flex items-center gap-1.5 rounded-full hover:ring-2 hover:ring-primary/30", className)}
        title={assignee ? `Assigned to ${assignee.name} · click to change` : "Assign"}
      >
        {children ?? (assignee ? <MemberAvatar name={assignee.name} color={assignee.avatarColor} size={size} /> : <span className={cn("inline-flex items-center justify-center rounded-full border border-dashed text-muted-foreground", size === "xs" ? "size-5" : size === "sm" ? "size-6" : "size-7")}><UserPlus className="size-3" /></span>)}
        {showName && <span className="text-sm">{assignee?.name ?? "Unassigned"}</span>}
      </button>
      <AssignDialog
        open={open}
        onOpenChange={setOpen}
        taskId={task.id}
        taskTitle={task.title}
        remainingHours={Math.max(task.estimatedHours - task.actualHours, 0)}
        currentAssigneeId={assignee?.id ?? null}
        onAssigned={(r) => { onAssigned?.(r); router.refresh(); }}
      />
    </>
  );
}
