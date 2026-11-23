import { and, asc, desc, eq, gte, inArray, lt, lte, ne, sql } from "drizzle-orm";
import { addDays, format } from "date-fns";
import { db } from "@/lib/db";
import { activityLog, dailyUpdates, memberLeaves, members, milestones, projects, tasks } from "@/lib/db/schema";
import { getTeamAvailability, resolveWeekStart } from "./availability";
import { listProjects } from "./projects";

import { nowInTz, todayInTz } from "@/lib/tz";
const todayStr = () => todayInTz();

export async function getOverview() {
  const today = todayStr();
  const weekStart = resolveWeekStart();
  const weekEnd = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const [projectCounts, taskCounts, [{ onLeave }], [{ updatedToday }], [{ activeMembers }], availability] = await Promise.all([
    db.select({ status: projects.status, c: sql<number>`count(*)`.mapWith(Number) }).from(projects).groupBy(projects.status),
    db
      .select({
        dueThisWeek: sql<number>`count(*) filter (where ${tasks.status} <> 'done' and ${tasks.dueDate} between ${format(weekStart, "yyyy-MM-dd")} and ${weekEnd})`.mapWith(Number),
        overdue: sql<number>`count(*) filter (where ${tasks.status} <> 'done' and ${tasks.dueDate} < ${today})`.mapWith(Number),
        blocked: sql<number>`count(*) filter (where ${tasks.status} = 'blocked')`.mapWith(Number),
        inProgress: sql<number>`count(*) filter (where ${tasks.status} in ('in_progress','in_review'))`.mapWith(Number),
        unassigned: sql<number>`count(*) filter (where ${tasks.status} not in ('done','backlog') and ${tasks.assigneeId} is null)`.mapWith(Number),
      })
      .from(tasks),
    db.select({ onLeave: sql<number>`count(distinct ${memberLeaves.memberId})`.mapWith(Number) }).from(memberLeaves).where(and(lte(memberLeaves.startDate, today), gte(memberLeaves.endDate, today))),
    db.select({ updatedToday: sql<number>`count(*)`.mapWith(Number) }).from(dailyUpdates).where(eq(dailyUpdates.date, today)),
    db.select({ activeMembers: sql<number>`count(*)`.mapWith(Number) }).from(members).where(ne(members.status, "inactive")),
    getTeamAvailability(),
  ]);

  const pc = Object.fromEntries(projectCounts.map((r) => [r.status, r.c])) as Record<string, number>;
  const tc = taskCounts[0];
  return {
    activeProjects: pc.active ?? 0,
    planningProjects: pc.planning ?? 0,
    onHoldProjects: pc.on_hold ?? 0,
    completedProjects: pc.completed ?? 0,
    tasksDueThisWeek: tc.dueThisWeek,
    overdueTasks: tc.overdue,
    blockedTasks: tc.blocked,
    inProgressTasks: tc.inProgress,
    unassignedTasks: tc.unassigned,
    activeMembers,
    membersFreeThisWeek: availability.filter((a) => a.badge === "free" || a.badge === "light").length,
    membersOverloaded: availability.filter((a) => a.badge === "overloaded").length,
    membersOnLeaveToday: onLeave,
    updatesMissingToday: Math.max(activeMembers - onLeave - updatedToday, 0),
  };
}

export async function getProjectsSummary() {
  const rows = await listProjects({ includeClosed: false });
  if (rows.length === 0) return [];
  const nextMs = await db
    .select({ projectId: milestones.projectId, id: milestones.id, name: milestones.name, dueDate: milestones.dueDate })
    .from(milestones)
    .where(and(inArray(milestones.projectId, rows.map((p) => p.id)), eq(milestones.status, "open")))
    .orderBy(asc(milestones.dueDate));
  const next = new Map<string, (typeof nextMs)[number]>();
  for (const m of nextMs) if (!next.has(m.projectId)) next.set(m.projectId, m);
  return rows.map((p) => ({ ...p, nextMilestone: next.get(p.id) ?? null }));
}

export async function getWorkloadHeatmap(week?: string) {
  const rows = await getTeamAvailability(week);
  return rows.map((r) => ({
    member: r.member,
    capacityHours: r.capacityHours,
    committedHours: r.committedHours,
    leaveHours: r.leaveHours,
    freeHours: r.freeHours,
    utilizationPercent: r.utilizationPercent,
    badge: r.badge,
    openTasks: r.openTasks,
    projects: r.projects,
  }));
}

export async function getUpcomingDeadlines(days = 14) {
  const today = todayStr();
  const until = format(addDays(nowInTz(), days), "yyyy-MM-dd");
  const [taskRows, msRows] = await Promise.all([
    db
      .select({
        id: tasks.id, title: tasks.title, dueDate: tasks.dueDate, status: tasks.status, priority: tasks.priority,
        project: { id: projects.id, name: projects.name },
        assignee: { id: members.id, name: members.name, avatarColor: members.avatarColor },
      })
      .from(tasks)
      .innerJoin(projects, eq(projects.id, tasks.projectId))
      .leftJoin(members, eq(members.id, tasks.assigneeId))
      .where(and(ne(tasks.status, "done"), gte(tasks.dueDate, today), lte(tasks.dueDate, until)))
      .orderBy(asc(tasks.dueDate)),
    db
      .select({ id: milestones.id, name: milestones.name, dueDate: milestones.dueDate, project: { id: projects.id, name: projects.name } })
      .from(milestones)
      .innerJoin(projects, eq(projects.id, milestones.projectId))
      .where(and(eq(milestones.status, "open"), gte(milestones.dueDate, today), lte(milestones.dueDate, until)))
      .orderBy(asc(milestones.dueDate)),
  ]);
  const byDay = new Map<string, { date: string; tasks: typeof taskRows; milestones: typeof msRows }>();
  const bucket = (d: string) => byDay.get(d) ?? byDay.set(d, { date: d, tasks: [], milestones: [] }).get(d)!;
  for (const t of taskRows) bucket(t.dueDate!).tasks.push({ ...t, assignee: t.assignee?.id ? t.assignee : null });
  for (const m of msRows) bucket(m.dueDate!).milestones.push(m);
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function getOverdue() {
  const today = todayStr();
  const rows = await db
    .select({
      id: tasks.id, title: tasks.title, dueDate: tasks.dueDate, status: tasks.status, priority: tasks.priority,
      project: { id: projects.id, name: projects.name },
      assignee: { id: members.id, name: members.name, avatarColor: members.avatarColor },
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .leftJoin(members, eq(members.id, tasks.assigneeId))
    .where(and(ne(tasks.status, "done"), lt(tasks.dueDate, today)))
    .orderBy(asc(tasks.dueDate));
  const t0 = new Date(`${today}T00:00:00Z`).getTime();
  return rows.map((r) => ({
    ...r,
    assignee: r.assignee?.id ? r.assignee : null,
    daysOverdue: Math.round((t0 - new Date(`${r.dueDate}T00:00:00Z`).getTime()) / 86_400_000),
  }));
}

/** Activity feed joined with entity names (one query per entity type, not per row). */
export async function getActivityFeed(limit = 30, entity?: { type: string; id: string }) {
  const rows = await db
    .select()
    .from(activityLog)
    .where(entity ? and(eq(activityLog.entityType, entity.type), eq(activityLog.entityId, entity.id)) : undefined)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
  const idsOf = (type: string) => [...new Set(rows.filter((r) => r.entityType === type).map((r) => r.entityId))];
  const [taskIds, projectIds, memberIds] = [idsOf("task"), idsOf("project"), idsOf("member")];
  const [taskRows, projectRows, memberRows] = await Promise.all([
    taskIds.length ? db.select({ id: tasks.id, name: tasks.title, projectId: tasks.projectId }).from(tasks).where(inArray(tasks.id, taskIds)) : [],
    projectIds.length ? db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, projectIds)) : [],
    memberIds.length ? db.select({ id: members.id, name: members.name }).from(members).where(inArray(members.id, memberIds)) : [],
  ]);
  const names = new Map<string, string>();
  for (const r of [...taskRows, ...projectRows, ...memberRows]) names.set(r.id, r.name);
  const taskProject = new Map(taskRows.map((t) => [t.id, t.projectId]));
  return rows.map((r) => ({
    ...r,
    entityName: names.get(r.entityId) ?? null,
    projectId: r.entityType === "task" ? taskProject.get(r.entityId) ?? null : r.entityType === "project" ? r.entityId : (r.details?.projectId as string | undefined) ?? null,
  }));
}

export async function getDashboard() {
  const [overview, projectsSummary, workload, upcoming, overdue, activity] = await Promise.all([
    getOverview(), getProjectsSummary(), getWorkloadHeatmap(), getUpcomingDeadlines(14), getOverdue(), getActivityFeed(20),
  ]);
  return { overview, projects: projectsSummary, workload, upcoming, overdue, activity, generatedAt: new Date().toISOString() };
}

