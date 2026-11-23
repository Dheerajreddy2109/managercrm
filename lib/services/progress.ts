import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { computeProjectProgress, type ProgressResult } from "./progress.calc";

export { computeProjectProgress, suggestHealth, expectedPercent } from "./progress.calc";
export type { ProgressResult } from "./progress.calc";

const cols = { projectId: tasks.projectId, milestoneId: tasks.milestoneId, status: tasks.status, estimatedHours: tasks.estimatedHours, dueDate: tasks.dueDate };

async function methods(ids: string[]) {
  const rows = await db.select({ id: projects.id, m: projects.progressMethod, manual: projects.manualProgress }).from(projects).where(inArray(projects.id, ids));
  return new Map(rows.map((r) => [r.id, r]));
}

/** "manual": the PM types the % (task counts still shown); otherwise computed from tasks. */
function calc(list: Parameters<typeof computeProjectProgress>[0], cfg?: { m: "manual" | "tasks" | "hours"; manual: number }) {
  const method = cfg?.m ?? "manual";
  const r = computeProjectProgress(list, new Date(), method === "manual" ? "tasks" : method);
  return method === "manual" ? { ...r, percent: Math.min(100, Math.max(0, cfg?.manual ?? 0)) } : r;
}

export async function getProjectProgress(projectId: string): Promise<ProgressResult> {
  return (await getProjectsProgress([projectId])).get(projectId)!;
}

/** Two queries for many projects, grouped in memory. Missing ids map to an empty progress. */
export async function getProjectsProgress(projectIds: string[]): Promise<Map<string, ProgressResult>> {
  const map = new Map<string, ProgressResult>();
  if (projectIds.length === 0) return map;
  const [rows, m] = await Promise.all([db.select(cols).from(tasks).where(inArray(tasks.projectId, projectIds)), methods(projectIds)]);
  const grouped = new Map<string, typeof rows>();
  for (const r of rows) grouped.set(r.projectId, [...(grouped.get(r.projectId) ?? []), r]);
  for (const id of projectIds) map.set(id, calc(grouped.get(id) ?? [], m.get(id)));
  return map;
}

/** Progress per milestone for one project (tasks without a milestone are ignored). */
export async function getMilestonesProgress(projectId: string): Promise<Map<string, ProgressResult>> {
  const [rows, m] = await Promise.all([db.select(cols).from(tasks).where(eq(tasks.projectId, projectId)), methods([projectId])]);
  const grouped = new Map<string, typeof rows>();
  for (const r of rows) if (r.milestoneId) grouped.set(r.milestoneId, [...(grouped.get(r.milestoneId) ?? []), r]);
  const map = new Map<string, ProgressResult>();
  for (const [id, list] of grouped) map.set(id, computeProjectProgress(list, new Date(), m.get(projectId)?.m === "hours" ? "hours" : "tasks"));
  return map;
}
