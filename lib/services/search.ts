import { ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { members, projects, tasks } from "@/lib/db/schema";

export async function globalSearch(q: string, limit = 6) {
  const term = `%${q.trim()}%`;
  if (!q.trim()) return { projects: [], tasks: [], members: [] };
  const [p, t, m] = await Promise.all([
    db.select({ id: projects.id, name: projects.name, status: projects.status, client: projects.client }).from(projects).where(or(ilike(projects.name, term), ilike(projects.client, term))).limit(limit),
    db
      .select({ id: tasks.id, title: tasks.title, status: tasks.status, projectId: tasks.projectId, projectName: sql<string>`(select name from projects where id = ${tasks.projectId})` })
      .from(tasks)
      .where(ilike(tasks.title, term))
      .limit(limit),
    db.select({ id: members.id, name: members.name, role: members.role, avatarColor: members.avatarColor }).from(members).where(or(ilike(members.name, term), ilike(members.email, term))).limit(limit),
  ]);
  return { projects: p, tasks: t, members: m };
}
