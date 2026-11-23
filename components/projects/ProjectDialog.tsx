"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProjectForm, type ProjectFormInitial } from "./ProjectForm";

export function ProjectDialog({ initial, trigger, openOnQuery, openTaskCount }: { initial?: ProjectFormInitial; trigger?: ReactNode; openOnQuery?: boolean; openTaskCount?: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(() => !!openOnQuery && params.get("new") === "1");
  const editing = !!initial?.id;
  useEffect(() => { if (openOnQuery && params.get("new") === "1") router.replace("/projects"); }, [openOnQuery, params, router]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger nativeButton={!trigger} render={trigger ? <span /> : <Button size="sm" />}>{trigger ?? (<><FolderPlus className="size-4" /> New project</>)}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>{editing ? "Change status, priority, dates, tech stack, progress % or on-hold reason." : "Set status, priority, dates and progress %. You can add tasks after creating."}</DialogDescription>
        </DialogHeader>
        <ProjectForm initial={initial} openTaskCount={openTaskCount} onDone={(id) => { setOpen(false); if (!editing) router.push(`/projects/${id}`); }} />
      </DialogContent>
    </Dialog>
  );
}
