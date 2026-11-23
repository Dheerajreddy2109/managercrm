"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskForm, type ProjectOption } from "./TaskForm";

export function TaskDialog({ projects, defaultProjectId, defaultStatus, trigger, openOnQuery, clearTo }: { projects: ProjectOption[]; defaultProjectId?: string; defaultStatus?: string; trigger?: ReactNode; openOnQuery?: boolean; clearTo?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(() => !!openOnQuery && params.get("new") === "1");
  useEffect(() => { if (openOnQuery && params.get("new") === "1") router.replace(clearTo ?? "/tasks"); }, [openOnQuery, params, router, clearTo]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger nativeButton={!trigger} render={trigger ? <span /> : <Button size="sm" />}>{trigger ?? (<><Plus className="size-4" /> New task</>)}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>New task</DialogTitle><DialogDescription>Estimates feed progress % and availability, so add one when you can.</DialogDescription></DialogHeader>
        <TaskForm projects={projects} defaultProjectId={defaultProjectId} defaultStatus={defaultStatus} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
