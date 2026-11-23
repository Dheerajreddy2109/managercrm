import { and, asc, eq, gte, lte } from "drizzle-orm";
import { handle } from "@/lib/api";
import { csvResponse, toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { dailyUpdateTasks, dailyUpdates, members, tasks } from "@/lib/db/schema";
import { queryObject } from "@/lib/validators/common";
import { memberUpdatesQuerySchema } from "@/lib/validators/dailyUpdate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?from&to -> one CSV row per update, with linked tasks flattened into one column. */
export const GET = handle(async (req) => {
  const { from, to } = memberUpdatesQuerySchema.parse(queryObject(req));
  const [updates, links] = await Promise.all([
    db
      .select({
        id: dailyUpdates.id, date: dailyUpdates.date, member: members.name, role: members.role, summary: dailyUpdates.summary,
        blockers: dailyUpdates.blockers, hoursLogged: dailyUpdates.hoursLogged, mood: dailyUpdates.mood, updatedAt: dailyUpdates.updatedAt,
      })
      .from(dailyUpdates)
      .innerJoin(members, eq(members.id, dailyUpdates.memberId))
      .where(and(gte(dailyUpdates.date, from), lte(dailyUpdates.date, to)))
      .orderBy(asc(dailyUpdates.date), asc(members.name)),
    db
      .select({ updateId: dailyUpdateTasks.dailyUpdateId, title: tasks.title, hours: dailyUpdateTasks.hours })
      .from(dailyUpdateTasks)
      .innerJoin(tasks, eq(tasks.id, dailyUpdateTasks.taskId))
      .innerJoin(dailyUpdates, eq(dailyUpdates.id, dailyUpdateTasks.dailyUpdateId))
      .where(and(gte(dailyUpdates.date, from), lte(dailyUpdates.date, to))),
  ]);
  const tasksBy = new Map<string, string[]>();
  for (const l of links) tasksBy.set(l.updateId, [...(tasksBy.get(l.updateId) ?? []), `${l.title} (${l.hours}h)`]);
  const rows = updates.map((u) => ({ ...u, blockers: u.blockers ?? "", mood: u.mood ?? "", tasks: tasksBy.get(u.id) ?? [] }));
  const csv = toCsv(rows, [
    { key: "date", header: "Date" }, { key: "member", header: "Member" }, { key: "role", header: "Role" },
    { key: "summary", header: "Summary" }, { key: "blockers", header: "Blockers" }, { key: "hoursLogged", header: "Hours" },
    { key: "mood", header: "Mood" }, { key: "tasks", header: "Tasks" }, { key: "updatedAt", header: "Updated" },
  ]);
  return csvResponse(csv, `daily-updates-${from}-to-${to}.csv`);
});
