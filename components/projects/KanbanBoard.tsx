"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, closestCorners, useSensor, useSensors, useDroppable,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { STATUS_LABEL } from "@/components/shared/StatusBadge";
import { TASK_STATUSES, type TaskStatus } from "@/lib/db/schema";
import { api } from "@/lib/hooks/useApi";
import { dueLabel, fmtHours } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { listTasks } from "@/lib/services/tasks";
import { AssigneeButton } from "@/components/tasks/AssigneeButton";
import { TaskDialog } from "@/components/tasks/TaskDialog";

export type BoardTask = Awaited<ReturnType<typeof listTasks>>["items"][number];
type Columns = Record<TaskStatus, BoardTask[]>;

const COLUMN_TONE: Record<TaskStatus, string> = {
  backlog: "border-t-muted-foreground/40", todo: "border-t-slate-400", in_progress: "border-t-blue-500", in_review: "border-t-violet-500", blocked: "border-t-red-500", done: "border-t-emerald-500",
};

function group(tasks: BoardTask[]): Columns {
  const c = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as BoardTask[]])) as Columns;
  for (const t of [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)) c[t.status].push(t);
  return c;
}

export function KanbanBoard({ tasks, projectId, projectName, milestones, onOpenTask }: { tasks: BoardTask[]; projectId: string; projectName: string; milestones: { id: string; name: string }[]; onOpenTask: (id: string) => void }) {
  const router = useRouter();
  const [cols, setCols] = useState<Columns>(() => group(tasks));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState(tasks);
  if (lastSync !== tasks) { setLastSync(tasks); setCols(group(tasks)); }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const all = useMemo(() => Object.values(cols).flat(), [cols]);
  const findCol = (id: string): TaskStatus | undefined => (TASK_STATUSES as readonly string[]).includes(id) ? (id as TaskStatus) : (TASK_STATUSES.find((s) => cols[s].some((t) => t.id === id)));

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findCol(String(active.id)); const to = findCol(String(over.id));
    if (!from || !to || from === to) return;
    setCols((prev) => {
      const moving = prev[from].find((t) => t.id === active.id)!;
      const overIdx = prev[to].findIndex((t) => t.id === over.id);
      const toList = [...prev[to]];
      toList.splice(overIdx < 0 ? toList.length : overIdx, 0, { ...moving, status: to });
      return { ...prev, [from]: prev[from].filter((t) => t.id !== active.id), [to]: toList };
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) { setCols(group(tasks)); return; }
    const col = findCol(String(active.id));
    if (!col) return;
    let next = cols;
    const fromIdx = cols[col].findIndex((t) => t.id === active.id);
    const toIdx = cols[col].findIndex((t) => t.id === over.id);
    if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
      next = { ...cols, [col]: arrayMove(cols[col], fromIdx, toIdx) };
      setCols(next);
    }
    const original = tasks.find((t) => t.id === active.id);
    const items = next[col].map((t, i) => ({ id: t.id, status: col, sortOrder: i }));
    // Also re-index the source column when the task changed columns.
    const sourceCol = original && original.status !== col ? original.status : null;
    if (sourceCol) items.push(...next[sourceCol].map((t, i) => ({ id: t.id, status: sourceCol, sortOrder: i })));
    try {
      await api("/api/tasks/bulk-move", { method: "PATCH", json: { items } });
      if (sourceCol) toast.success(`Moved to ${STATUS_LABEL[col]}`);
      router.refresh();
    } catch {
      setCols(group(tasks));
    }
  }

  const active = activeId ? all.find((t) => t.id === activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-3 md:-mx-5 md:px-5">
        {TASK_STATUSES.map((s) => (
          <Column key={s} status={s} tasks={cols[s]} projectId={projectId} projectName={projectName} milestones={milestones} onOpenTask={onOpenTask} />
        ))}
      </div>
      <DragOverlay>{active ? <Card task={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function Column({ status, tasks, projectId, projectName, milestones, onOpenTask }: { status: TaskStatus; tasks: BoardTask[]; projectId: string; projectName: string; milestones: { id: string; name: string }[]; onOpenTask: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const hours = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  return (
    <div ref={setNodeRef} className={cn("flex w-64 shrink-0 flex-col rounded-lg border border-t-2 bg-muted/30", COLUMN_TONE[status], isOver && "bg-primary/5")}>
      <div className="flex items-center justify-between px-2.5 py-2">
        <span className="text-xs font-medium">{STATUS_LABEL[status]} <span className="ml-1 text-muted-foreground">{tasks.length}</span></span>
        <span className="text-[11px] text-muted-foreground">{fmtHours(hours)}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-16 flex-1 flex-col gap-1.5 px-2 pb-2">
          {tasks.map((t) => <SortableCard key={t.id} task={t} onOpen={() => onOpenTask(t.id)} />)}
        </div>
      </SortableContext>
      <div className="px-2 pb-2">
        <TaskDialog projects={[{ id: projectId, name: projectName, milestones }]} defaultProjectId={projectId} defaultStatus={status} trigger={<Button variant="ghost" size="xs" className="w-full justify-start text-muted-foreground"><Plus className="size-3" /> Add task</Button>} />
      </div>
    </div>
  );
}

function SortableCard({ task, onOpen }: { task: BoardTask; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
      <Card task={task} onOpen={onOpen} />
    </div>
  );
}

function Card({ task, onOpen, dragging }: { task: BoardTask; onOpen?: () => void; dragging?: boolean }) {
  const due = dueLabel(task.dueDate, task.status === "done");
  return (
    <div onClick={onOpen} className={cn("cursor-grab rounded-md border bg-card p-2 text-sm shadow-xs hover:border-primary/40 active:cursor-grabbing", dragging && "rotate-1 shadow-lg")}>
      <div className="flex items-start gap-1.5">
        <PriorityBadge priority={task.priority} className="mt-0.5" />
        <span className="line-clamp-2 flex-1 leading-snug">{task.title}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className={cn(due.tone === "danger" && "font-medium text-red-600", due.tone === "warn" && "text-amber-600")}>{task.dueDate ? due.text : ""}</span>
        <span className="flex items-center gap-2">
          {task.checklist.total > 0 && <span className="flex items-center gap-0.5"><CheckSquare className="size-3" />{task.checklist.done}/{task.checklist.total}</span>}
          {task.estimatedHours > 0 && <span className="tabular-nums">{fmtHours(task.actualHours)}/{fmtHours(task.estimatedHours)}</span>}
          <AssigneeButton task={task} assignee={task.assignee} size="xs" />
        </span>
      </div>
    </div>
  );
}
