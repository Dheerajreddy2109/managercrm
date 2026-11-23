import { and, asc, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberLeaves, members, tasks } from "@/lib/db/schema";
import { HttpError, notFound } from "@/lib/api";
import type { CreateLeaveInput, CreateMemberInput, UpdateMemberInput } from "@/lib/validators/member";
import { logActivity } from "./activity";

export type MemberFilters = { status?: "active" | "on_leave" | "inactive"; role?: string; search?: string };

export async function listMembers(filters: MemberFilters = {}) {
  const where = and(
    filters.status ? eq(members.status, filters.status) : undefined,
    filters.role ? eq(members.role, filters.role as typeof members.$inferSelect.role) : undefined,
    filters.search
      ? or(ilike(members.name, `%${filters.search}%`), ilike(members.email, `%${filters.search}%`), sql`${members.skills}::text ILIKE ${"%" + filters.search + "%"}`)
      : undefined,
  );

  // One query: members + open task count via correlated subquery.
  const openTasks = db
    .select({ c: count() })
    .from(tasks)
    .where(and(eq(tasks.assigneeId, members.id), ne(tasks.status, "done")));

  return db
    .select({
      id: members.id,
      name: members.name,
      email: members.email,
      role: members.role,
      skills: members.skills,
      weeklyCapacityHours: members.weeklyCapacityHours,
      status: members.status,
      avatarColor: members.avatarColor,
      notes: members.notes,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt,
      openTasks: sql<number>`(${openTasks})`.mapWith(Number),
    })
    .from(members)
    .where(where)
    .orderBy(asc(members.name));
}

export async function getMember(id: string) {
  const member = await db.query.members.findFirst({
    where: eq(members.id, id),
    with: {
      leaves: { orderBy: desc(memberLeaves.startDate) },
      projectMemberships: { with: { project: { columns: { id: true, name: true, status: true, health: true } } } },
    },
  });
  if (!member) throw notFound("Member");

  const [{ openTasks }] = await db
    .select({ openTasks: count() })
    .from(tasks)
    .where(and(eq(tasks.assigneeId, id), ne(tasks.status, "done")));

  const { projectMemberships, ...rest } = member;
  return {
    ...rest,
    openTasks,
    projects: projectMemberships.map((pm) => ({ ...pm.project, projectRole: pm.projectRole, allocationPercent: pm.allocationPercent })),
  };
}

export async function createMember(input: CreateMemberInput) {
  const [row] = await db.insert(members).values(input).returning();
  await logActivity("member", row.id, "created", { message: `Added ${row.name} to the team` });
  return row;
}

export async function updateMember(id: string, input: UpdateMemberInput) {
  const [row] = await db.update(members).set(input).where(eq(members.id, id)).returning();
  if (!row) throw notFound("Member");
  await logActivity("member", id, "updated", { message: `Updated ${row.name}`, fields: Object.keys(input) });
  return row;
}

/** Soft delete by default (status -> inactive). Hard delete only when requested and the member owns no tasks. */
export async function removeMember(id: string, hard = false) {
  const existing = await db.query.members.findFirst({ where: eq(members.id, id), columns: { id: true, name: true } });
  if (!existing) throw notFound("Member");

  if (!hard) {
    await db.update(members).set({ status: "inactive" }).where(eq(members.id, id));
    await logActivity("member", id, "deactivated", { message: `Deactivated ${existing.name}` });
    return { id, hard: false };
  }

  const [{ c }] = await db.select({ c: count() }).from(tasks).where(eq(tasks.assigneeId, id));
  if (c > 0) throw new HttpError(409, `Cannot hard-delete: ${existing.name} still has ${c} task(s). Unassign them or deactivate instead.`);

  await db.delete(members).where(eq(members.id, id));
  await logActivity("member", id, "deleted", { message: `Deleted ${existing.name}` });
  return { id, hard: true };
}

export async function listLeaves(memberId: string) {
  await ensureMember(memberId);
  return db.select().from(memberLeaves).where(eq(memberLeaves.memberId, memberId)).orderBy(desc(memberLeaves.startDate));
}

export async function addLeave(memberId: string, input: CreateLeaveInput) {
  const m = await ensureMember(memberId);
  const [row] = await db.insert(memberLeaves).values({ memberId, ...input }).returning();
  await logActivity("member", memberId, "leave_added", { message: `${m.name} on leave ${input.startDate} → ${input.endDate}` });
  return row;
}

export async function removeLeave(memberId: string, leaveId: string) {
  const [row] = await db.delete(memberLeaves).where(and(eq(memberLeaves.id, leaveId), eq(memberLeaves.memberId, memberId))).returning();
  if (!row) throw notFound("Leave");
  await logActivity("member", memberId, "leave_removed", { message: `Removed leave ${row.startDate} → ${row.endDate}` });
  return row;
}

async function ensureMember(id: string) {
  const m = await db.query.members.findFirst({ where: eq(members.id, id), columns: { id: true, name: true } });
  if (!m) throw notFound("Member");
  return m;
}

