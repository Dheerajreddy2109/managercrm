"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Clock, MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { STATUS_LABEL, StatusBadge } from "@/components/shared/StatusBadge";
import { PRIORITIES, TASK_STATUSES } from "@/lib/db/schema";
import { api } from "@/lib/hooks/useApi";
import { fmtAgo, fmtHours, titleCase } from "@/lib/format";
import type { getTask } from "@/lib/services/tasks";
import { AssigneeButton } from "./AssigneeButton";

type Task = Awaited<ReturnType<typeof getTask>>;
type Activity = { id: string; action: string; details: { message?: string }; createdAt: string };

/** Mount once per page. Opens when ?task=<id> is present. */
export function TaskSheet() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const taskId = params.get("task");
  const [loaded, setLoaded] = useState<Task | null>(null);
  const task = loaded && loaded.id === taskId ? loaded : null;
  const [activity, setActivity] = useState<Activity[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("task");
    router.replace(next.size ? `${pathname}?${next}` : pathname);
    router.refresh();
  }, [params, pathname, router]);

  const load = useCallback(async (id: string) => {
    const [t, a] = await Promise.all([
      api<Task>(`/api/tasks/${id}`, { silent: true }),
      api<Activity[]>(`/api/dashboard/activity?entityType=task&entityId=${id}&limit=20`, { silent: true }),
    ]);
    setLoaded(t);
    setActivity(a);
  }, []);

  useEffect(() => {
    if (!taskId) return;
    const timer = setTimeout(() => { load(taskId).catch(() => { toast.error("Task not found"); close(); }); }, 0);
    return () => clearTimeout(timer);
  }, [taskId, load, close]);

  async function patch(fields: Record<string, unknown>) {
    if (!task) return;
    await api(`/api/tasks/${task.id}`, { method: "PATCH", json: fields });
    await load(task.id);
    router.refresh();
  }
  async function move(status: string) {
    if (!task) return;
    await api(`/api/tasks/${task.id}/move`, { method: "POST", json: { status } });
    toast.success(`Moved to ${STATUS_LABEL[status]}`);
    await load(task.id);
    router.refresh();
  }

  return (
    <Sheet open={!!taskId} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {!task ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <SheetHeader className="border-b px-5 py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{task.project.name}</span>{task.milestone && <span>· {task.milestone.name}</span>}
                {task.overdue && <span className="ml-auto font-medium text-red-600">Overdue</span>}
              </div>
              <SheetTitle className="text-base">
                <InlineText value={task.title} onSave={(title) => patch({ title })} className="text-base font-semibold" />
              </SheetTitle>
              <SheetDescription className="sr-only">Task details</SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm sm:grid-cols-3">
              <Field label="Status">
                <NativeSelect value={task.status} onChange={(e) => move(e.target.value)} className="w-full">{TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</NativeSelect>
              </Field>
              <Field label="Priority">
                <NativeSelect value={task.priority} onChange={(e) => patch({ priority: e.target.value })} className="w-full">{PRIORITIES.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}</NativeSelect>
              </Field>
              <Field label="Assignee">
                <AssigneeButton task={task} assignee={task.assignee} showName onAssigned={() => load(task.id)} className="h-8 w-full rounded-lg border border-input px-2 hover:ring-0 hover:bg-muted/50" />
              </Field>
              <Field label="Due date">
                <Input type="date" value={task.dueDate ?? ""} onChange={(e) => patch({ dueDate: e.target.value || null })} />
              </Field>
              <Field label="Estimate">
                <Input type="number" step="0.5" min={0} defaultValue={task.estimatedHours} key={`est-${task.estimatedHours}`} onBlur={(e) => { const v = Number(e.target.value); if (v !== task.estimatedHours) patch({ estimatedHours: v }); }} />
              </Field>
              <Field label="Actual">
                <LogHours task={task} onLogged={() => load(task.id)} />
              </Field>
              <Field label="Tags" className="col-span-2 sm:col-span-3">
                <InlineText value={task.tags.join(", ")} placeholder="Add tags, comma-separated" onSave={(v) => patch({ tags: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </Field>
            </div>

            <Section title="Description">
              <InlineText multiline value={task.description ?? ""} placeholder="Add a description…" onSave={(v) => patch({ description: v || null })} />
            </Section>

            <Section title={`Checklist ${task.checklist.length ? `${task.checklist.filter((c) => c.isDone).length}/${task.checklist.length}` : ""}`}>
              <Checklist taskId={task.id} items={task.checklist} onChange={() => load(task.id)} />
            </Section>

            <Section title={`Comments ${task.comments.length || ""}`}>
              <Comments taskId={task.id} comments={task.comments} onChange={() => load(task.id)} />
            </Section>

            <Section title="Activity">
              <ul className="space-y-1.5 text-xs">
                {activity.length === 0 && <li className="text-muted-foreground">No activity.</li>}
                {activity.map((a) => <li key={a.id} className="flex gap-2"><span className="text-muted-foreground">{fmtAgo(a.createdAt)}</span><span>{a.details.message ?? a.action}</span></li>)}
              </ul>
            </Section>

            <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} showLabel /></span>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 className="size-3.5" /> Delete</Button>
            </div>
            <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this task?" description="This removes the task, its checklist, comments and logged hours. This cannot be undone." confirmLabel="Delete" destructive
              onConfirm={async () => { await api(`/api/tasks/${task.id}`, { method: "DELETE" }); toast.success("Task deleted"); close(); }} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><div className="mb-1 text-[11px] font-medium text-muted-foreground uppercase">{label}</div>{children}</div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-t px-5 py-4"><h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase">{title}</h3>{children}</section>;
}

function InlineText({ value, onSave, placeholder, multiline, className }: { value: string; onSave: (v: string) => Promise<void> | void; placeholder?: string; multiline?: boolean; className?: string }) {
  const [v, setV] = useState(value);
  const [editing, setEditing] = useState(false);
  const [prev, setPrev] = useState(value);
  if (prev !== value) { setPrev(value); if (!editing) setV(value); }
  const commit = async () => { setEditing(false); if (v.trim() !== value.trim()) await onSave(v.trim()); };
  if (multiline) {
    return <Textarea value={v} rows={4} placeholder={placeholder} onFocus={() => setEditing(true)} onChange={(e) => setV(e.target.value)} onBlur={commit} className="text-sm" />;
  }
  return <Input value={v} placeholder={placeholder} onFocus={() => setEditing(true)} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} className={className} />;
}

function LogHours({ task, onLogged }: { task: Task; onLogged: () => void }) {
  const [h, setH] = useState("");
  const [open, setOpen] = useState(false);
  async function log() {
    const n = Number(h);
    if (!n || n <= 0) return;
    await api(`/api/tasks/${task.id}/hours`, { method: "POST", json: { hours: n } });
    toast.success(`Logged ${n}h`);
    setH(""); setOpen(false); onLogged();
  }
  return (
    <div className="flex h-8 items-center gap-1">
      <span className="tabular-nums">{fmtHours(task.actualHours)}</span>
      <span className="text-xs text-muted-foreground">/ {fmtHours(task.estimatedHours)}</span>
      {open ? (
        <><Input type="number" step="0.5" min={0} value={h} onChange={(e) => setH(e.target.value)} className="ml-1 h-7 w-16" placeholder="h" autoFocus onKeyDown={(e) => { if (e.key === "Enter") log(); }} /><Button size="xs" onClick={log}>Log</Button></>
      ) : (
        <Button variant="ghost" size="xs" className="ml-auto" onClick={() => setOpen(true)} title="Log hours"><Clock className="size-3" /> Log</Button>
      )}
    </div>
  );
}

function Checklist({ taskId, items, onChange }: { taskId: string; items: Task["checklist"]; onChange: () => void }) {
  const [text, setText] = useState("");
  async function add() {
    if (!text.trim()) return;
    await api(`/api/tasks/${taskId}/checklist`, { method: "POST", json: { text: text.trim() } });
    setText(""); onChange();
  }
  return (
    <div className="space-y-1">
      {items.map((c) => (
        <div key={c.id} className="group flex items-center gap-2 text-sm">
          <Checkbox checked={c.isDone} onCheckedChange={async (v) => { await api(`/api/tasks/${taskId}/checklist/${c.id}`, { method: "PATCH", json: { isDone: v === true } }); onChange(); }} />
          <span className={c.isDone ? "flex-1 text-muted-foreground line-through" : "flex-1"}>{c.text}</span>
          <button type="button" className="opacity-0 group-hover:opacity-100" onClick={async () => { await api(`/api/tasks/${taskId}/checklist/${c.id}`, { method: "DELETE" }); onChange(); }} aria-label="Remove"><Trash2 className="size-3.5 text-muted-foreground" /></button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <Plus className="size-3.5 text-muted-foreground" />
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add item and press Enter" className="h-7" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
      </div>
    </div>
  );
}

function Comments({ taskId, comments, onChange }: { taskId: string; comments: Task["comments"]; onChange: () => void }) {
  const [body, setBody] = useState("");
  async function add() {
    if (!body.trim()) return;
    await api(`/api/tasks/${taskId}/comments`, { method: "POST", json: { body: body.trim() } });
    setBody(""); onChange();
  }
  return (
    <div className="space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="group rounded-md bg-muted/50 px-2.5 py-2 text-sm">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>{fmtAgo(c.createdAt)}</span><button type="button" className="opacity-0 group-hover:opacity-100" onClick={async () => { await api(`/api/tasks/${taskId}/comments/${c.id}`, { method: "DELETE" }); onChange(); }} aria-label="Delete comment"><Trash2 className="size-3" /></button></div>
          <p className="whitespace-pre-wrap">{c.body}</p>
        </div>
      ))}
      <div className="flex items-end gap-2">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Write a comment… (⌘+Enter to post)" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(); }} />
        <Button size="sm" onClick={add} disabled={!body.trim()}><MessageSquare className="size-3.5" /> Post</Button>
      </div>
    </div>
  );
}
