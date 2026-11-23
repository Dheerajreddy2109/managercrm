import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { digests } from "@/lib/db/schema";
import { getOverdue, getOverview, getUpcomingDeadlines } from "./dashboard";
import { getUpdatesForDate } from "./dailyUpdates";
import { todayInTz } from "@/lib/tz";

export type DailyDigest = {
  date: string;
  overview: Awaited<ReturnType<typeof getOverview>>;
  blockers: { member: { id: string; name: string }; blockers: string; tasks: { id: string; title: string }[] }[];
  missingUpdates: { id: string; name: string }[];
  overdue: Awaited<ReturnType<typeof getOverdue>>;
  upcoming: Awaited<ReturnType<typeof getUpcomingDeadlines>>;
};

/** Compute today's blockers + overdue + missing updates (the data behind the 09:00 digest). */
export async function buildDailyDigest(date = todayInTz()): Promise<DailyDigest> {
  const [overview, day, overdue, upcoming] = await Promise.all([getOverview(), getUpdatesForDate(date), getOverdue(), getUpcomingDeadlines(7)]);

  return {
    date,
    overview,
    blockers: day.blockers.map((b) => ({ member: { id: b.member.id, name: b.member.name }, blockers: b.blockers, tasks: b.tasks.map((t) => ({ id: t.id, title: t.title })) })),
    missingUpdates: day.entries.filter((e) => !e.update && !e.onLeave).map((e) => ({ id: e.member.id, name: e.member.name })),
    overdue,
    upcoming,
  };
}

/** Build the digest and persist one row per date (re-runs replace the same day's row). */
export async function storeDailyDigest(date = todayInTz()) {
  const payload = await buildDailyDigest(date);
  await db.delete(digests).where(eq(digests.date, date));
  const [row] = await db.insert(digests).values({ date, payload }).returning({ id: digests.id, createdAt: digests.createdAt });
  return { id: row.id, date, payload };
}
