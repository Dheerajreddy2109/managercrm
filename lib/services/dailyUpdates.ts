import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { addDays, format } from "date-fns";
import { db } from "@/lib/db";
import { dailyUpdateTasks, dailyUpdates, memberLeaves, members, projects, tasks } from "@/lib/db/schema";
import { HttpError, notFound } from "@/lib/api";
import type { UpsertDailyUpdateInput } from "@/lib/validators/dailyUpdate";
import { logActivity } from "./activity";
import { resolveWeekStart } from "./availability";
import { hoursDelta, normalizeTaskHours, sumHours } from "./dailyUpdates.calc";
import { adjustActualHoursBatch } from "./tasks";

import { todayInTz } from "@/lib/tz";
const todayStr = () => todayInTz();

/** Insert or update the (member, date) entry; task hours are replaced and tasks.actual_hours adjusted by the delta. */
export async function upsertDailyUpdate(input: UpsertDailyUpdateInput) {
  const member = await db.query.members.findFirst({ where: eq(members.id, input.memberId), columns: { id: true, name: true } });
  if (!member) throw notFound("Member");

  const nextTasks = normalizeTaskHours(input.tasks);
  if (nextTasks.length) {
    const found = await db.select({ id: tasks.id }).from(tasks).where(inArray(tasks.id, nextTasks.map((t) => t.taskId)));
    if (found.length !== nextTasks.length) throw new HttpError(422, "One or more taskIds do not exist");
  }
  const hoursLogged = input.hoursLogged ?? sumHours(nextTasks);

  const existing = await db.query.dailyUpdates.findFirst({
    where: and(eq(dailyUpdates.memberId, input.memberId), eq(dailyUpdates.date, input.date)),
    with: { tasks: true },
  });
  const prevTasks = existing?.tasks.map((t) => ({ taskId: t.taskId, hours: t.hours })) ?? [];

  const [row] = await db
    .insert(dailyUpdates)
    .values({ memberId: input.memberId, date: input.date, summary: input.summary, blockers: input.blockers ?? null, hoursLogged, mood: input.mood ?? null })
    .onConflictDoUpdate({
      target: [dailyUpdates.memberId, dailyUpdates.date],
      set: { summary: input.summary, blockers: input.blockers ?? null, hoursLogged, mood: input.mood ?? null, updatedAt: new Date() },
    })
    .returning();

  // Replace task rows, then apply hour deltas to tasks.actual_hours.
  await db.delete(dailyUpdateTasks).where(eq(dailyUpdateTasks.dailyUpdateId, row.id));
  if (nextTasks.length) await db.insert(dailyUpdateTasks).values(nextTasks.map((t) => ({ dailyUpdateId: row.id, taskId: t.taskId, hours: t.hours })));
  await adjustActualHoursBatch(hoursDelta(prevTasks, nextTasks));

  await logActivity("daily_update", row.id, existing ? "updated" : "created", {
    message: `${member.name} ${existing ? "edited" : "posted"} the update for ${input.date}${input.blockers ? " (has blockers)" : ""}`,
    memberId: member.id,
    date: input.date,
  });
  return getDailyUpdate(row.id);
}

export async function getDailyUpdate(id: string) {
  const row = await db.query.dailyUpdates.findFirst({
    where: eq(dailyUpdates.id, id),
    with: {
      member: { columns: { id: true, name: true, avatarColor: true, role: true } },
      tasks: { with: { task: { columns: { id: true, title: true, status: true, projectId: true } } } },
    },
  });
  if (!row) throw notFound("Daily update");
  return { ...row, tasks: row.tasks.map((t) => ({ taskId: t.taskId, hours: t.hours, task: t.task })) };
}

/** Delete an update and revert the hours it had logged against tasks. */
export async function deleteDailyUpdate(id: string) {
  const existing = await db.query.dailyUpdates.findFirst({ where: eq(dailyUpdates.id, id), with: { tasks: true } });
  if (!existing) throw notFound("Daily update");
  await adjustActualHoursBatch(existing.tasks.map((t) => ({ taskId: t.taskId, hours: -t.hours })));
  await db.delete(dailyUpdates).where(eq(dailyUpdates.id, id));
  await logActivity("daily_update", id, "deleted", { message: `Deleted the update for ${existing.date}`, memberId: existing.memberId });
  return { id };
}

/** Every non-inactive member with their update (or null) for a date, plus missing count and a flat blockers list. */
export async function getUpdatesForDate(date = todayStr()) {
  const [memberRows, updateRows, leaveRows] = await Promise.all([
    db.select({ id: members.id, name: members.name, role: members.role, avatarColor: members.avatarColor, status: members.status }).from(members).where(ne(members.status, "inactive")).orderBy(asc(members.name)),
    db.query.dailyUpdates.findMany({
      where: eq(dailyUpdates.date, date),
      with: { tasks: { with: { task: { columns: { id: true, title: true, status: true, projectId: true } } } } },
    }),
    db.select({ memberId: memberLeaves.memberId }).from(memberLeaves).where(and(lte(memberLeaves.startDate, date), gte(memberLeaves.endDate, date))),
  ]);
  const byMember = new Map(updateRows.map((u) => [u.memberId, u]));
  const onLeave = new Set(leaveRows.map((l) => l.memberId));

  const entries = memberRows.map((m) => {
    const u = byMember.get(m.id);
    return {
      member: m,
      onLeave: onLeave.has(m.id),
      update: u ? { ...u, tasks: u.tasks.map((t) => ({ taskId: t.taskId, hours: t.hours, task: t.task })) } : null,
    };
  });
  const blockers = entries
    .filter((e) => e.update?.blockers)
    .map((e) => ({ member: e.member, blockers: e.update!.blockers!, tasks: e.update!.tasks.map((t) => t.task) }));

  return {
    date,
    entries,
    updatedCount: entries.filter((e) => e.update).length,
    missingCount: entries.filter((e) => !e.update && !e.onLeave).length,
    onLeaveCount: entries.filter((e) => e.onLeave).length,
    blockers,
  };
}

export async function getUpdatesForMember(memberId: string, from: string, to: string) {
  const m = await db.query.members.findFirst({ where: eq(members.id, memberId), columns: { id: true } });
  if (!m) throw notFound("Member");
  const rows = await db.query.dailyUpdates.findMany({
    where: and(eq(dailyUpdates.memberId, memberId), gte(dailyUpdates.date, from), lte(dailyUpdates.date, to)),
    orderBy: desc(dailyUpdates.date),
    with: { tasks: { with: { task: { columns: { id: true, title: true, status: true, projectId: true } } } } },
  });
  return rows.map((u) => ({ ...u, tasks: u.tasks.map((t) => ({ taskId: t.taskId, hours: t.hours, task: t.task })) }));
}

/** Per-day completion ratios for a range (for the week strip / calendar heat view). */
export async function getUpdatesRange(from: string, to: string) {
  const [[{ activeMembers }], rows] = await Promise.all([
    db.select({ activeMembers: sql<number>`count(*)`.mapWith(Number) }).from(members).where(ne(members.status, "inactive")),
    db
      .select({
        date: dailyUpdates.date,
        updated: sql<number>`count(*)`.mapWith(Number),
        withBlockers: sql<number>`count(*) filter (where ${dailyUpdates.blockers} is not null and ${dailyUpdates.blockers} <> '')`.mapWith(Number),
        hours: sql<number>`coalesce(sum(${dailyUpdates.hoursLogged}), 0)`.mapWith(Number),
      })
      .from(dailyUpdates)
      .where(and(gte(dailyUpdates.date, from), lte(dailyUpdates.date, to)))
      .groupBy(dailyUpdates.date)
      .orderBy(asc(dailyUpdates.date)),
  ]);
  return { from, to, activeMembers, days: rows };
}

/** Weekly digest per project: done / in progress / blocked this week, hours logged, members with blockers. */
export async function weeklyDigest(week?: string) {
  const weekStart = resolveWeekStart(week);
  const ws = format(weekStart, "yyyy-MM-dd");
  const we = format(addDays(weekStart, 6), "yyyy-MM-dd");
  const wsDate = new Date(`${ws}T00:00:00Z`);
  const weDate = new Date(`${we}T23:59:59Z`);

  const [projectRows, taskRows, hoursRows, blockerRows] = await Promise.all([
    db.select({ id: projects.id, name: projects.name, status: projects.status, health: projects.health }).from(projects).where(ne(projects.status, "cancelled")).orderBy(asc(projects.name)),
    db
      .select({ id: tasks.id, projectId: tasks.projectId, title: tasks.title, status: tasks.status, completedAt: tasks.completedAt, dueDate: tasks.dueDate, assigneeId: tasks.assigneeId })
      .from(tasks)
      .where(ne(tasks.status, "backlog")),
    db
      .select({ projectId: tasks.projectId, hours: sql<number>`coalesce(sum(${dailyUpdateTasks.hours}), 0)`.mapWith(Number) })
      .from(dailyUpdateTasks)
      .innerJoin(dailyUpdates, eq(dailyUpdates.id, dailyUpdateTasks.dailyUpdateId))
      .innerJoin(tasks, eq(tasks.id, dailyUpdateTasks.taskId))
      .where(and(gte(dailyUpdates.date, ws), lte(dailyUpdates.date, we)))
      .groupBy(tasks.projectId),
    db
      .select({ memberId: members.id, name: members.name, date: dailyUpdates.date, blockers: dailyUpdates.blockers })
      .from(dailyUpdates)
      .innerJoin(members, eq(members.id, dailyUpdates.memberId))
      .where(and(gte(dailyUpdates.date, ws), lte(dailyUpdates.date, we), sql`${dailyUpdates.blockers} is not null and ${dailyUpdates.blockers} <> ''`))
      .orderBy(desc(dailyUpdates.date)),
  ]);

  const hoursBy = new Map(hoursRows.map((h) => [h.projectId, h.hours]));
  const byProject = new Map<string, typeof taskRows>();
  for (const t of taskRows) byProject.set(t.projectId, [...(byProject.get(t.projectId) ?? []), t]);

  const projectsOut = projectRows.map((p) => {
    const ts = byProject.get(p.id) ?? [];
    const doneThisWeek = ts.filter((t) => t.status === "done" && t.completedAt && t.completedAt >= wsDate && t.completedAt <= weDate);
    const nextWeekEnd = format(addDays(weekStart, 13), "yyyy-MM-dd");
    return {
      project: p,
      doneThisWeek: doneThisWeek.map(({ id, title }) => ({ id, title })),
      inProgress: ts.filter((t) => t.status === "in_progress" || t.status === "in_review").map(({ id, title, status }) => ({ id, title, status })),
      blocked: ts.filter((t) => t.status === "blocked").map(({ id, title }) => ({ id, title })),
      overdue: ts.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < todayStr()).map(({ id, title, dueDate }) => ({ id, title, dueDate })),
      dueNextWeek: ts.filter((t) => t.status !== "done" && t.dueDate && t.dueDate > we && t.dueDate <= nextWeekEnd).map(({ id, title, dueDate }) => ({ id, title, dueDate })),
      hoursLogged: hoursBy.get(p.id) ?? 0,
    };
  });

  return { weekStart: ws, weekEnd: we, projects: projectsOut, blockers: blockerRows };
}
