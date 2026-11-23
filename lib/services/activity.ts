import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

export type EntityType = "member" | "project" | "task" | "daily_update" | "milestone" | "note";

export type ActivityDetails = {
  /** Human-readable sentence shown in the activity feed, e.g. "Moved to In Review". */
  message: string;
  [key: string]: unknown;
};

export async function logActivity(
  entityType: EntityType,
  entityId: string,
  action: string,
  details: ActivityDetails,
) {
  await db.insert(activityLog).values({ entityType, entityId, action, details });
}

export async function recentActivity(limit = 30) {
  return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
}
