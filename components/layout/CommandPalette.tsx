"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderKanban, ListTodo, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NAV } from "./nav";

type Results = {
  projects: { id: string; name: string; status: string; client: string | null }[];
  tasks: { id: string; title: string; status: string; projectId: string; projectName: string }[];
  members: { id: string; name: string; role: string; avatarColor: string }[];
};
const EMPTY: Results = { projects: [], tasks: [], members: [] };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!q.trim()) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        const body = await res.json();
        if (body.ok) setResults(body.data);
      } catch { /* aborted */ } finally { setLoading(false); }
    }, 150);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, open]);

  const shown = q.trim() ? results : EMPTY;
  const go = (href: string) => { setOpen(false); setQ(""); router.push(href); };

  return (
    <>
      <Button variant="outline" size="sm" className="w-48 justify-start gap-2 text-muted-foreground max-sm:w-auto" onClick={() => setOpen(true)}>
        <Search className="size-3.5" />
        <span className="max-sm:hidden">Search…</span>
        <kbd className="ml-auto rounded border bg-muted px-1 text-[10px] max-sm:hidden">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search projects, tasks and team members">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search projects, tasks, people…" value={q} onValueChange={setQ} />
          <CommandList>
            <CommandEmpty>{loading ? "Searching…" : q ? "No results." : "Type to search."}</CommandEmpty>
            {!q && (
              <CommandGroup heading="Go to">
                {NAV.map((n) => (
                  <CommandItem key={n.href} value={n.href} onSelect={() => go(n.href)}><n.icon className="size-4" /> {n.label}</CommandItem>
                ))}
              </CommandGroup>
            )}
            {shown.projects.length > 0 && (
              <CommandGroup heading="Projects">
                {shown.projects.map((p) => (
                  <CommandItem key={p.id} value={`p-${p.id}`} onSelect={() => go(`/projects/${p.id}`)}>
                    <FolderKanban className="size-4" /> <span className="flex-1 truncate">{p.name}</span>
                    {p.client && <span className="text-xs text-muted-foreground">{p.client}</span>}
                    <StatusBadge status={p.status} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {shown.tasks.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Tasks">
                  {shown.tasks.map((t) => (
                    <CommandItem key={t.id} value={`t-${t.id}`} onSelect={() => go(`/projects/${t.projectId}?task=${t.id}`)}>
                      <ListTodo className="size-4" /> <span className="flex-1 truncate">{t.title}</span>
                      <span className="text-xs text-muted-foreground">{t.projectName}</span>
                      <StatusBadge status={t.status} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {shown.members.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Team">
                  {shown.members.map((m) => (
                    <CommandItem key={m.id} value={`m-${m.id}`} onSelect={() => go(`/team/${m.id}`)}>
                      <MemberAvatar name={m.name} color={m.avatarColor} size="xs" /> <span className="flex-1">{m.name}</span>
                      <span className="text-xs text-muted-foreground"><Users className="mr-1 inline size-3" />{m.role}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
