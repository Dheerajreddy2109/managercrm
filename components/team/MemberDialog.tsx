"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MemberForm, type MemberFormInitial } from "./MemberForm";

export function MemberDialog({ initial, trigger, openOnQuery }: { initial?: MemberFormInitial; trigger?: ReactNode; openOnQuery?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(() => !!openOnQuery && params.get("new") === "1");
  const editing = !!initial?.id;

  useEffect(() => {
    if (openOnQuery && params.get("new") === "1") router.replace("/team");
  }, [openOnQuery, params, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger nativeButton={!trigger} render={trigger ? <span /> : <Button size="sm" />}>
        {trigger ?? (<><UserPlus className="size-4" /> Add member</>)}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit member" : "Add team member"}</DialogTitle>
          <DialogDescription>{editing ? "Update profile, capacity or status." : "Capacity drives the availability badges when you assign work."}</DialogDescription>
        </DialogHeader>
        <MemberForm initial={initial} onDone={(id) => { setOpen(false); if (!editing) router.push(`/team/${id}`); }} />
      </DialogContent>
    </Dialog>
  );
}
