"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MemberDialog } from "./MemberDialog";
import type { MemberFormInitial } from "./MemberForm";
import { api } from "@/lib/hooks/useApi";

export function MemberHeaderActions({ member }: { member: MemberFormInitial & { id: string; name: string; status: string } }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <MemberDialog initial={member} trigger={<Button variant="outline" size="sm"><Pencil className="size-3.5" /> Edit</Button>} />
      {member.status !== "inactive" && (
        <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}><UserX className="size-3.5" /> Deactivate</Button>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Deactivate ${member.name}?`}
        description="They will be hidden from availability and assignment. Their tasks and history are kept. You can reactivate later by editing the member."
        confirmLabel="Deactivate"
        destructive
        onConfirm={async () => {
          await api(`/api/members/${member.id}`, { method: "DELETE" });
          toast.success("Member deactivated");
          router.refresh();
        }}
      />
    </>
  );
}
