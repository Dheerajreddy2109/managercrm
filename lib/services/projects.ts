import { and, asc, desc, eq, ilike, inArray, ne, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { members, milestones, projectMembers, projectNotes, projects, tasks } from "@/lib/db/schema";
import { HttpError, notFound } from "@/lib/api";
import type {
  AddProjectMemberInput, CreateMilestoneInput, CreateNoteInput, CreateProjectInput,
  UpdateMilestoneInput, UpdateProjectInput, UpdateProjectMemberInput,
} from "@/lib/validators/project";
import { logActivity } from "./activity";
import { getMilestonesProgress, getProjectProgress, getProjectsProgress, suggestHealth } from "./progress";
import { computeProjectProgress } from "./progress.calc";

export type ProjectFilters = {
  status?: (typeof projects.$inferSelect)["status"];
  priority?: (typeof projects.$inferSelect)["priority"];
  health?: (typeof projects.$inferSelect)["health"];
  search?: string;
  includeClosed?: boolean;
};

const CLOSED = ["completed", "cancelled"] as const;

export async function listProjects(filters: ProjectFilters = {}) {
  const where = and(
    filters.status ? eq(projects.status, filters.status) : filters.includeClosed ? undefined : notInArray(projects.status, [...CLOSED]),
    filters.priority ? eq(projects.priority, filters.priority) : undefined,
    filters.health ? eq(projects.health, filters.health) : undefined,
    filters.search ? or(ilike(projects.name, `%${filters.search}%`), ilike(projects.client, `%${filters.search}%`)) : undefined,
  );
  const rows = await db.select().from(projects).where(where).orderBy(asc(projects.name));
  if (rows.length === 0) return [];
  const ids = rows.map((p) => p.id);

  const [progress, memberRows, openTasks] = await Promise.all([
    getProjectsProgress(ids),
    db
      .select({ projectId: projectMembers.projectId, id: members.id, name: members.name, avatarColor: members.avatarColor, role: members.role, skills: members.skills, projectRole: projectMembers.projectRole, aStatus: projectMembers.status, aPriority: projectMembers.priority, aDue: projectMembers.dueDate, aPercent: projectMembers.progressPercent, aTech: projectMembers.tech, aNotes: projectMembers.notes })
      .from(projectMembers)
      .innerJoin(members, eq(members.id, projectMembers.memberId))
      .where(inArray(projectMembers.projectId, ids)),
    db
      .select({ projectId: tasks.projectId, assigneeId: tasks.assigneeId, title: tasks.title, status: tasks.status })
      .from(tasks)
      .where(and(inArray(tasks.projectId, ids), ne(tasks.status, "done")))
      .orderBy(asc(tasks.sortOrder)),
  ]);
  // "Working on" = the member's open tasks in this project, in-progress first.
  const rank = (s: string) => (s === "in_progress" ? 0 : s === "blocked" ? 1 : s === "in_review" ? 2 : 3);
  const workBy = new Map<string, { title: string; status: string }[]>();
  for (const t of [...openTasks].sort((a, b) => rank(a.status) - rank(b.status))) {
    if (!t.assigneeId) continue;
    const k = `${t.projectId}:${t.assigneeId}`;
    workBy.set(k, [...(workBy.get(k) ?? []), { title: t.title, status: t.status }]);
  }
  const membersBy = new Map<string, typeof memberRows>();
  for (const m of memberRows) membersBy.set(m.projectId, [...(membersBy.get(m.projectId) ?? []), m]);

  return rows.map((p) => {
    const prog = progress.get(p.id)!;
    return {
      ...p,
      progress: prog,
      healthAuto: suggestHealth(p, prog),
      overdueCount: prog.overdueTasks,
      blockedCount: prog.blockedTasks,
      members: (membersBy.get(p.id) ?? []).map(({ id, name, avatarColor, role, skills, projectRole, aStatus, aPriority, aDue, aPercent, aTech, aNotes }) => ({
        id, name, avatarColor, role, skills, projectRole, workingOn: workBy.get(`${p.id}:${id}`) ?? [],
        assignment: { status: aStatus, priority: aPriority, dueDate: aDue, percent: aPercent, tech: aTech, notes: aNotes },
      })),
    };
  });
}

export async function getProject(id: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      members: { with: { member: { columns: { id: true, name: true, role: true, avatarColor: true, status: true, weeklyCapacityHours: true } } } },
      milestones: { orderBy: [asc(milestones.sortOrder), asc(milestones.dueDate)] },
      notes: { orderBy: desc(projectNotes.createdAt) },
    },
  });
  if (!project) throw notFound("Project");
  const [progress, msProgress] = await Promise.all([getProjectProgress(id), getMilestonesProgress(id)]);
  const { members: pms, milestones: ms, ...rest } = project;
  return {
    ...rest,
    progress,
    healthAuto: suggestHealth(project, progress),
    members: pms.map((pm) => ({ ...pm.member, projectRole: pm.projectRole, allocationPercent: pm.allocationPercent, assignmentStatus: pm.status, priority: pm.priority, dueDate: pm.dueDate, progressPercent: pm.progressPercent, tech: pm.tech, notes: pm.notes })),
    milestones: ms.map((m) => ({ ...m, progress: msProgress.get(m.id) ?? computeProjectProgress([]) })),
  };
}

export async function createProject(input: CreateProjectInput) {
  const [row] = await db.insert(projects).values(input).returning();
  await logActivity("project", row.id, "created", { message: `Created project ${row.name}` });
  return row;
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const before = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!before) throw notFound("Project");
  const { markOpenTasksDone, ...fields } = input;
  const patch: Omit<UpdateProjectInput, "markOpenTasksDone"> = { ...fields };
  // Closing a project stamps actual_end_date; reopening clears it.
  if (input.status && CLOSED.includes(input.status as (typeof CLOSED)[number]) && !before.actualEndDate && !input.actualEndDate) {
    patch.actualEndDate = new Date().toISOString().slice(0, 10);
  }
  if (input.status && !CLOSED.includes(input.status as (typeof CLOSED)[number]) && before.actualEndDate && input.actualEndDate === undefined) {
    patch.actualEndDate = null;
  }
  const [row] = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
  const messages: string[] = [];
  if (input.status && input.status !== before.status) messages.push(`Status ${before.status} → ${input.status}`);
  if (input.health && input.health !== before.health) messages.push(`Health ${before.health} → ${input.health}`);

  // Completing a project can optionally close every task that is still open.
  let closedTasks = 0;
  if (markOpenTasksDone && row.status === "completed") {
    const now = new Date();
    const closed = await db
      .update(tasks)
      .set({ status: "done", completedAt: now, startedAt: sql`coalesce(${tasks.startedAt}, ${now.toISOString()}::timestamptz)` })
      .where(and(eq(tasks.projectId, id), ne(tasks.status, "done")))
      .returning({ id: tasks.id });
    closedTasks = closed.length;
    if (closedTasks) messages.push(`Marked ${closedTasks} open task${closedTasks === 1 ? "" : "s"} done`);
  }

  await logActivity("project", id, "updated", { message: messages.length ? messages.join("; ") : `Updated ${row.name}`, fields: Object.keys(fields) });
  return { ...row, closedTasks };
}

export async function archiveProject(id: string, status: "completed" | "cancelled" = "completed") {
  return updateProject(id, { status });
}

export async function deleteProject(id: string) {
  const [row] = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id, name: projects.name });
  if (!row) throw notFound("Project");
  await logActivity("project", id, "deleted", { message: `Deleted project ${row.name}` });
  return row;
}

// ---- members ----
export async function listProjectMembers(projectId: string) {
  await ensureProject(projectId);
  return db
    .select({
      id: members.id, name: members.name, role: members.role, avatarColor: members.avatarColor, status: members.status,
      projectRole: projectMembers.projectRole, allocationPercent: projectMembers.allocationPercent,
      assignmentStatus: projectMembers.status, priority: projectMembers.priority, dueDate: projectMembers.dueDate,
      progressPercent: projectMembers.progressPercent, tech: projectMembers.tech, notes: projectMembers.notes,
    })
    .from(projectMembers)
    .innerJoin(members, eq(members.id, projectMembers.memberId))
    .where(eq(projectMembers.projectId, projectId))
    .orderBy(asc(members.name));
}

export async function addProjectMember(projectId: string, input: AddProjectMemberInput) {
  const p = await ensureProject(projectId);
  const m = await db.query.members.findFirst({ where: eq(members.id, input.memberId), columns: { id: true, name: true } });
  if (!m) throw notFound("Member");
  const [row] = await db
    .insert(projectMembers)
    .values({ projectId, ...input })
    .onConflictDoUpdate({ target: [projectMembers.projectId, projectMembers.memberId], set: { ...input, memberId: undefined } })
    .returning();
  await logActivity("project", projectId, "member_added", { message: `Added ${m.name} to ${p.name}`, memberId: m.id });
  return row;
}

export async function updateProjectMember(projectId: string, memberId: string, input: UpdateProjectMemberInput) {
  const [row] = await db
    .update(projectMembers)
    .set(input)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.memberId, memberId)))
    .returning();
  if (!row) throw notFound("Project member");
  await logActivity("project", projectId, "member_updated", { message: "Updated project member", memberId });
  return row;
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const [row] = await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.memberId, memberId)))
    .returning();
  if (!row) throw notFound("Project member");
  await logActivity("project", projectId, "member_removed", { message: "Removed project member", memberId });
  return row;
}

// ---- milestones ----
export async function listMilestones(projectId: string) {
  await ensureProject(projectId);
  const [rows, prog] = await Promise.all([
    db.select().from(milestones).where(eq(milestones.projectId, projectId)).orderBy(asc(milestones.sortOrder), asc(milestones.dueDate)),
    getMilestonesProgress(projectId),
  ]);
  return rows.map((m) => ({ ...m, progress: prog.get(m.id) ?? computeProjectProgress([]) }));
}

export async function createMilestone(projectId: string, input: CreateMilestoneInput) {
  const p = await ensureProject(projectId);
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${milestones.sortOrder}), -1) + 1`.mapWith(Number) })
    .from(milestones)
    .where(eq(milestones.projectId, projectId));
  const [row] = await db.insert(milestones).values({ projectId, ...input, sortOrder: input.sortOrder ?? next }).returning();
  await logActivity("milestone", row.id, "created", { message: `Added milestone ${row.name} to ${p.name}`, projectId });
  return row;
}

export async function updateMilestone(projectId: string, milestoneId: string, input: UpdateMilestoneInput) {
  const [row] = await db
    .update(milestones)
    .set(input)
    .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)))
    .returning();
  if (!row) throw notFound("Milestone");
  await logActivity("milestone", milestoneId, "updated", { message: `Updated milestone ${row.name}`, projectId });
  return row;
}

export async function deleteMilestone(projectId: string, milestoneId: string) {
  const [row] = await db
    .delete(milestones)
    .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)))
    .returning();
  if (!row) throw notFound("Milestone");
  await logActivity("milestone", milestoneId, "deleted", { message: `Deleted milestone ${row.name}`, projectId });
  return row;
}

// ---- notes / risks / decisions ----
export async function listNotes(projectId: string) {
  await ensureProject(projectId);
  return db.select().from(projectNotes).where(eq(projectNotes.projectId, projectId)).orderBy(desc(projectNotes.createdAt));
}

export async function createNote(projectId: string, input: CreateNoteInput) {
  await ensureProject(projectId);
  if (input.type === "risk" && !input.severity) throw new HttpError(422, "severity is required for a risk");
  const [row] = await db.insert(projectNotes).values({ projectId, ...input }).returning();
  await logActivity("note", row.id, "created", { message: `Added ${row.type}${row.severity ? ` (${row.severity})` : ""}`, projectId });
  return row;
}

export async function deleteNote(projectId: string, noteId: string) {
  const [row] = await db
    .delete(projectNotes)
    .where(and(eq(projectNotes.id, noteId), eq(projectNotes.projectId, projectId)))
    .returning();
  if (!row) throw notFound("Note");
  return row;
}

export async function ensureProject(id: string) {
  const p = await db.query.projects.findFirst({ where: eq(projects.id, id), columns: { id: true, name: true } });
  if (!p) throw notFound("Project");
  return p;
}
