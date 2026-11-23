"use client";

import { useRouter } from "next/navigation";
import { CalendarCheck, FolderKanban, ListTodo, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Global "+ New". Each entry opens the target page with ?new=1 which that page's dialog listens for. */
export function NewMenu() {
  const router = useRouter();
  const go = (href: string) => () => router.push(href);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" />}>
        <Plus className="size-4" /> New
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={go("/tasks?new=1")}><ListTodo className="size-4" /> Task</DropdownMenuItem>
        <DropdownMenuItem onClick={go("/projects?new=1")}><FolderKanban className="size-4" /> Project</DropdownMenuItem>
        <DropdownMenuItem onClick={go("/team?new=1")}><UserPlus className="size-4" /> Member</DropdownMenuItem>
        <DropdownMenuItem onClick={go("/daily-updates")}><CalendarCheck className="size-4" /> Daily update</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
