import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lt, lte, ne, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  dailyUpdateTasks, members, milestones, projects, taskChecklist, taskComments, tasks,
  type TaskStatus,
} from "@/lib/db/schema";
import { HttpError, notFound } from "@/lib/api";
import type { BulkMoveInput, CreateTaskInput, TaskListQuery, UpdateTaskInput } from "@/lib/validators/task";
import { logActivity } from "./activity";
import { getMemberAvailability, type MemberAvailability } from "./availability";
import { previewAssign } from "./availability.calc";
import { remaining, transitionMessage, transitionPatch } from "./tasks.calc";

import { todayInTz } from "@/lib/tz";
const today = () => todayInTz();

const PRIORITY_RANK = sql`case ${tasks.priority} when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end`;

export async function listTasks(q: TaskListQuery) {
  const where = and(
    q.projectId ? eq(tasks.projectId, q.projectId) : undefined,
    q.assigneeId ? eq(tasks.assigneeId, q.assigneeId) : undefined,
    q.milestoneId ? eq(tasks.milestoneId, q.milestoneId) : undefined,
    q.status?.length ? inArray(tasks.status, q.status) : q.includeDone ? undefined : ne(tasks.status, "done"),
    q.priority?.length ? inArray(tasks.priority, q.priority) : undefined,
    q.dueBefore ? lte(tasks.dueDate, q.dueBefore) : undefined,
    q.dueAfter ? gte(tasks.dueDate, q.dueAfter) : undefined,
    q.overdue ? and(lt(tasks.dueDate, today()), ne(tasks.status, "done")) : undefined,
    q.unassigned ? isNull(tasks.assigneeId) : undefined,
    q.search ? or(ilike(tasks.title, `%${q.search}%`), ilike(tasks.description, `%${q.search}%`)) : undefined,
    q.tag ? sql`${q.tag} = ANY(${tasks.tags})` : undefined,
  );

  const sortCol: Record<TaskListQuery["sort"], SQL | PgColumn> = {
    dueDate: tasks.dueDate,
    priority: PRIORITY_RANK,
    createdAt: tasks.createdAt,
    updatedAt: tasks.updatedAt,
    title: tasks.title,
    sortOrder: tasks.sortOrder,
  };
  const dir = q.order === "desc" ? desc : asc;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        task: tasks,
        project: { id: projects.id, name: projects.name },
        assignee: { id: members.id, name: members.name, avatarColor: members.avatarColor },
        milestone: { id: milestones.id, name: milestones.name },
        checklistTotal: sql<number>`(select count(*) from ${taskChecklist} where ${taskChecklist.taskId} = ${tasks.id})`.mapWith(Number),
        checklistDone: sql<number>`(select count(*) from ${taskChecklist} where ${taskChecklist.taskId} = ${tasks.id} and ${taskChecklist.isDone})`.mapWith(Number),
      })
      .from(tasks)
      .innerJoin(projects, eq(projects.id, tasks.projectId))
      .leftJoin(members, eq(members.id, tasks.assigneeId))
      .leftJoin(milestones, eq(milestones.id, tasks.milestoneId))
      .where(where)
      .orderBy(dir(sortCol[q.sort]), asc(tasks.createdAt))
      .limit(q.limit)
      .offset(q.offset),
    db.select({ total: count() }).from(tasks).where(where),
  ]);

  return {
    total,
    limit: q.limit,
    offset: q.offset,
    items: rows.map((r) => ({
      ...r.task,
      overdue: !!r.task.dueDate && r.task.dueDate < today() && r.task.status !== "done",
      project: r.project,
      assignee: r.assignee?.id ? r.assignee : null,
      milestone: r.milestone?.id ? r.milestone : null,
      checklist: { total: r.checklistTotal, done: r.checklistDone },
    })),
  };
}

export async function getTask(id: string) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      project: { columns: { id: true, name: true, status: true } },
      assignee: { columns: { id: true, name: true, avatarColor: true, role: true } },
      milestone: { columns: { id: true, name: true, dueDate: true } },
      checklist: { orderBy: asc(taskChecklist.sortOrder) },
      comments: { orderBy: desc(taskComments.createdAt) },
    },
  });
  if (!task) throw notFound("Task");
  const [{ loggedHours }] = await db
    .select({ loggedHours: sql<number>`coalesce(sum(${dailyUpdateTasks.hours}), 0)`.mapWith(Number) })
    .from(dailyUpdateTasks)
    .where(eq(dailyUpdateTasks.taskId, id));
  return { ...task, loggedHours, remainingHours: remaining(task.estimatedHours, task.actualHours), overdue: !!task.dueDate && task.dueDate < today() && task.status !== "done" };
}

export async function createTask(input: CreateTaskInput) {
  const project = await db.query.projects.findFirst({ where: eq(projects.id, input.projectId), columns: { id: true, name: true } });
  if (!project) throw notFound("Project");
  if (input.milestoneId) {
    const ms = await db.query.milestones.findFirst({ where: and(eq(milestones.id, input.milestoneId), eq(milestones.projectId, input.projectId)), columns: { id: true } });
    if (!ms) throw new HttpError(422, "Milestone does not belong to this project");
  }
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${tasks.sortOrder}), -1) + 1`.mapWith(Number) })
    .from(tasks)
    .where(and(eq(tasks.projectId, input.projectId), eq(tasks.status, input.status)));

  const timestamps = transitionPatch({ fromStatus: "todo", toStatus: input.status, startedAt: null, completedAt: null });
  const [row] = await db.insert(tasks).values({ ...input, ...timestamps, sortOrder: next }).returning();
  await logActivity("task", row.id, "created", { message: `Created "${row.title}" in ${project.name}`, projectId: project.id });
  if (row.assigneeId) {
    const m = await db.query.members.findFirst({ where: eq(members.id, row.assigneeId), columns: { name: true } });
    await logActivity("task", row.id, "assigned", { message: `Assigned to ${m?.name ?? "member"}`, assigneeId: row.assigneeId });
  }
  return row;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const before = await mustGet(id);
  if (input.milestoneId) {
    const ms = await db.query.milestones.findFirst({ where: and(eq(milestones.id, input.milestoneId), eq(milestones.projectId, before.projectId)), columns: { id: true } });
    if (!ms) throw new HttpError(422, "Milestone does not belong to this task's project");
  }
  const [row] = await db.update(tasks).set(input).where(eq(tasks.id, id)).returning();
  await logActivity("task", id, "updated", { message: `Updated "${row.title}"`, fields: Object.keys(input) });
  return row;
}

export type AssignResult = { task: typeof tasks.$inferSelect; assigneeAvailability: MemberAvailability | null; warning: string | null };

/** Assign (or unassign with null). Never blocks; returns a warning when the member would be overloaded. */
export async function assignTask(id: string, assigneeId: string | null): Promise<AssignResult> {
  const before = await mustGet(id);
  let availability: MemberAvailability | null = null;
  let warning: string | null = null;
  let name = "Unassigned";

  if (assigneeId) {
    availability = await getMemberAvailability(assigneeId); // throws 404 if missing/inactive
    name = availability.member.name;
    const alreadyMine = before.assigneeId === assigneeId;
    const extra = alreadyMine ? 0 : remaining(before.estimatedHours, before.actualHours);
    const after = previewAssign(availability, extra, availability.badge === "on_leave");
    if (after.badge === "on_leave") warning = `${name} is on leave right now.`;
    else if (after.badge === "overloaded") warning = `${name} would be overloaded: ${after.committedHours}h committed of ${after.capacityHours}h this week.`;
    else if (after.badge === "busy") warning = `${name} would be busy: only ${after.freeHours}h free this week.`;
    availability = { ...after, member: availability.member, projects: availability.projects };
  }

  const [row] = await db.update(tasks).set({ assigneeId }).where(eq(tasks.id, id)).returning();
  await logActivity("task", id, assigneeId ? "assigned" : "unassigned", { message: assigneeId ? `Assigned to ${name}` : "Unassigned", assigneeId });
  return { task: row, assigneeAvailability: availability, warning };
}

/** Move to a status column (and optional position); re-indexes the destination column. */
export async function moveTask(id: string, status: TaskStatus, sortOrder?: number) {
  const before = await mustGet(id);
  const patch = transitionPatch({ fromStatus: before.status, toStatus: status, startedAt: before.startedAt, completedAt: before.completedAt });

  const column = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.projectId, before.projectId), eq(tasks.status, status), ne(tasks.id, id)))
    .orderBy(asc(tasks.sortOrder), asc(tasks.createdAt));
  const ids = column.map((c) => c.id);
  const pos = sortOrder === undefined ? ids.length : Math.min(Math.max(sortOrder, 0), ids.length);
  ids.splice(pos, 0, id);

  const updates = ids.map((tid, i) =>
    tid === id
      ? db.update(tasks).set({ ...patch, sortOrder: i }).where(eq(tasks.id, tid))
      : db.update(tasks).set({ sortOrder: i }).where(eq(tasks.id, tid)),
  );
  await db.batch(updates as [typeof updates[number], ...typeof updates]);

  await logActivity("task", id, "status_changed", { message: transitionMessage(before.status, status), from: before.status, to: status });
  return mustGet(id);
}

/** Drag-and-drop persistence: many tasks, each with target status + sortOrder. */
export async function bulkMove(input: BulkMoveInput) {
  const ids = input.items.map((i) => i.id);
  const existing = await db.select().from(tasks).where(inArray(tasks.id, ids));
  if (existing.length !== ids.length) throw notFound("One or more tasks");
  const byId = new Map(existing.map((t) => [t.id, t]));

  const updates = input.items.map((item) => {
    const t = byId.get(item.id)!;
    const patch = t.status === item.status ? {} : transitionPatch({ fromStatus: t.status, toStatus: item.status, startedAt: t.startedAt, completedAt: t.completedAt });
    return db.update(tasks).set({ ...patch, sortOrder: item.sortOrder }).where(eq(tasks.id, item.id));
  });
  await db.batch(updates as [typeof updates[number], ...typeof updates]);

  const changed = input.items.filter((i) => byId.get(i.id)!.status !== i.status);
  await Promise.all(
    changed.map((i) => logActivity("task", i.id, "status_changed", { message: transitionMessage(byId.get(i.id)!.status, i.status), from: byId.get(i.id)!.status, to: i.status })),
  );
  return { updated: input.items.length, statusChanges: changed.length };
}

export async function logHours(id: string, hours: number) {
  const [row] = await db
    .update(tasks)
    .set({ actualHours: sql`${tasks.actualHours} + ${hours}` })
    .where(eq(tasks.id, id))
    .returning();
  if (!row) throw notFound("Task");
  await logActivity("task", id, "hours_logged", { message: `Logged ${hours}h`, hours });
  return row;
}

/** Apply many signed deltas in one round-trip (daily update upsert / delete). */
export async function adjustActualHoursBatch(deltas: { taskId: string; hours: number }[]) {
  const updates = deltas.filter((d) => d.hours !== 0).map((d) => db.update(tasks).set({ actualHours: sql`greatest(${tasks.actualHours} + ${d.hours}, 0)` }).where(eq(tasks.id, d.taskId)));
  if (!updates.length) return;
  await db.batch(updates as [typeof updates[number], ...typeof updates]);
}

export async function deleteTask(id: string) {
  const [row] = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id, title: tasks.title });
  if (!row) throw notFound("Task");
  await logActivity("task", id, "deleted", { message: `Deleted "${row.title}"` });
  return row;
}

// ---- checklist ----
export async function listChecklist(taskId: string) {
  await mustGet(taskId);
  return db.select().from(taskChecklist).where(eq(taskChecklist.taskId, taskId)).orderBy(asc(taskChecklist.sortOrder));
}
export async function addChecklistItem(taskId: string, text: string) {
  await mustGet(taskId);
  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${taskChecklist.sortOrder}), -1) + 1`.mapWith(Number) }).from(taskChecklist).where(eq(taskChecklist.taskId, taskId));
  const [row] = await db.insert(taskChecklist).values({ taskId, text, sortOrder: next }).returning();
  return row;
}
export async function updateChecklistItem(taskId: string, itemId: string, patch: { text?: string; isDone?: boolean; sortOrder?: number }) {
  const [row] = await db.update(taskChecklist).set(patch).where(and(eq(taskChecklist.id, itemId), eq(taskChecklist.taskId, taskId))).returning();
  if (!row) throw notFound("Checklist item");
  return row;
}
export async function removeChecklistItem(taskId: string, itemId: string) {
  const [row] = await db.delete(taskChecklist).where(and(eq(taskChecklist.id, itemId), eq(taskChecklist.taskId, taskId))).returning();
  if (!row) throw notFound("Checklist item");
  return row;
}

// ---- comments ----
export async function listComments(taskId: string) {
  await mustGet(taskId);
  return db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(desc(taskComments.createdAt));
}
export async function addComment(taskId: string, body: string) {
  await mustGet(taskId);
  const [row] = await db.insert(taskComments).values({ taskId, body }).returning();
  await logActivity("task", taskId, "commented", { message: "Added a comment", commentId: row.id });
  return row;
}
export async function removeComment(taskId: string, commentId: string) {
  const [row] = await db.delete(taskComments).where(and(eq(taskComments.id, commentId), eq(taskComments.taskId, taskId))).returning();
  if (!row) throw notFound("Comment");
  return row;
}

async function mustGet(id: string) {
  const t = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
  if (!t) throw notFound("Task");
  return t;
}
