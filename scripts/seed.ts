import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { TEAM } from "./data/team";
import { canonProject, mapPriority, mapStatus, mapTaskStatus, parseEstimate, rollupPriority, rollupStatus, techToRole, techToSkills } from "./data/importHelpers";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing — copy .env.example to .env.local");
const db = drizzle(neon(url), { schema });


async function clearAll() {
  // FK-safe order: children first. Cascades would do it too, but be explicit.
  await db.delete(schema.activityLog);
  await db.delete(schema.digests);
  await db.delete(schema.dailyUpdateTasks);
  await db.delete(schema.dailyUpdates);
  await db.delete(schema.taskComments);
  await db.delete(schema.taskChecklist);
  await db.delete(schema.tasks);
  await db.delete(schema.milestones);
  await db.delete(schema.projectNotes);
  await db.delete(schema.projectMembers);
  await db.delete(schema.memberLeaves);
  await db.delete(schema.projects);
  await db.delete(schema.members);
}

const COLORS = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16", "#f97316", "#6366f1"];

async function main() {
  console.log("Clearing tables…");
  await clearAll();

  // ---- Members ----
  const memberRows = await db
    .insert(schema.members)
    .values(TEAM.map((e, i) => ({
      name: e.name, role: techToRole(e.techStack), skills: techToSkills(e.techStack), weeklyCapacityHours: 40,
      avatarColor: COLORS[i % COLORS.length], device: e.device ?? null, deviceSpecs: e.specs ?? null,
      deviceIssues: e.issue ?? null, availableFrom: e.availableFrom ?? null,
    })))
    .returning();
  const memberId = new Map(memberRows.map((m) => [m.name, m.id]));

  // ---- Projects: every name from assignments + daily tasks, merged by spelling ----
  type Agg = { statuses: ReturnType<typeof mapStatus>[]; priorities: ReturnType<typeof mapPriority>[]; dues: string[]; tech: Set<string>; percents: number[]; holdNotes: string[] };
  const agg = new Map<string, Agg>();
  const get = (name: string) => {
    if (!agg.has(name)) agg.set(name, { statuses: [], priorities: [], dues: [], tech: new Set(), percents: [], holdNotes: [] });
    return agg.get(name)!;
  };
  for (const e of TEAM) {
    for (const [proj, tech, due, status, prio, notes, pct] of e.projects) {
      const a = get(canonProject(proj));
      a.statuses.push(mapStatus(status)); a.priorities.push(mapPriority(prio));
      if (due) a.dues.push(due);
      for (const t of techToSkills(tech)) if (["node", "php", "flutter", "ionic", "web design", "frontend", "backend"].includes(t)) a.tech.add(t);
      if (pct != null) a.percents.push(pct);
      if (status === "On Hold" && notes) a.holdNotes.push(`${e.name}: ${notes}`);
    }
    for (const d of e.daily) get(canonProject(d[1]));
  }
  const projectRows = await db
    .insert(schema.projects)
    .values([...agg].map(([name, a]) => {
      const status = rollupStatus(a.statuses);
      return {
        name, status, priority: rollupPriority(a.priorities), health: "green" as const, techStack: [...a.tech],
        targetEndDate: a.dues.sort().at(-1) ?? null,
        progressMethod: "manual" as const,
        manualProgress: status === "completed" ? 100 : a.percents.length ? Math.min(...a.percents) : 0,
        holdReason: status === "on_hold" ? a.holdNotes.join("\n") || null : null,
      };
    }))
    .returning();
  const projectId = new Map(projectRows.map((p) => [p.name, p.id]));

  // ---- Assignments (each person's own status / notes / % for the project) ----
  const assignments = new Map<string, typeof schema.projectMembers.$inferInsert>();
  for (const e of TEAM) {
    const mid = memberId.get(e.name)!;
    for (const [proj, tech, due, status, prio, notes, pct, role] of e.projects) {
      const pid = projectId.get(canonProject(proj))!;
      assignments.set(`${pid}:${mid}`, {
        projectId: pid, memberId: mid, projectRole: role ?? null, allocationPercent: 100, tech: tech || null,
        status: mapStatus(status), priority: mapPriority(prio), dueDate: due || null, progressPercent: pct ?? null, notes: notes || null,
      });
    }
    // People who logged daily work on a project they don't list are still linked to it.
    for (const d of e.daily) {
      const pid = projectId.get(canonProject(d[1]))!;
      if (!assignments.has(`${pid}:${mid}`)) assignments.set(`${pid}:${mid}`, { projectId: pid, memberId: mid, allocationPercent: 100 });
    }
  }
  await db.insert(schema.projectMembers).values([...assignments.values()]);

  // ---- Daily tasks → tasks (+ checklist, notes as comments) and one daily update per person per day ----
  const ts = (iso: string) => new Date(`${iso}T12:00:00+05:30`);
  let taskCount = 0, updateCount = 0;
  for (const e of TEAM) {
    const mid = memberId.get(e.name)!;
    const byDate = new Map<string, { id: string; line: string; blocker?: string }[]>();
    for (const [date, proj, title, est, status, notes, checklist, desc] of e.daily) {
      const st = mapTaskStatus(status);
      const hours = parseEstimate(est);
      const description = [desc, hours == null && est ? `Estimate: ${est}` : ""].filter(Boolean).join("\n") || null;
      const [task] = await db.insert(schema.tasks).values({
        projectId: projectId.get(canonProject(proj))!, assigneeId: mid, title, description, status: st, priority: "medium",
        estimatedHours: hours ?? 0, dueDate: date, startedAt: st !== "todo" ? ts(date) : null, completedAt: st === "done" ? ts(date) : null,
      }).returning();
      taskCount++;
      if (checklist?.length) await db.insert(schema.taskChecklist).values(checklist.map((text, i) => ({ taskId: task.id, text, isDone: st === "done", sortOrder: i })));
      if (notes) await db.insert(schema.taskComments).values({ taskId: task.id, body: notes });
      const line = `${canonProject(proj)} — ${title}${status ? ` (${status})` : ""}${notes ? `: ${notes}` : ""}`;
      byDate.set(date, [...(byDate.get(date) ?? []), { id: task.id, line, blocker: /fail|pending|not done|didn.t get/i.test(notes) ? `${canonProject(proj)}: ${notes}` : undefined }]);
    }
    for (const [date, items] of byDate) {
      const blockers = items.map((x) => x.blocker).filter(Boolean).join("\n") || null;
      const [du] = await db.insert(schema.dailyUpdates).values({ memberId: mid, date, summary: items.map((x) => x.line).join("\n"), blockers, hoursLogged: 0 }).returning();
      await db.insert(schema.dailyUpdateTasks).values(items.map((x) => ({ dailyUpdateId: du.id, taskId: x.id, hours: 0 })));
      updateCount++;
    }
  }

  console.log(`Seeded ${memberRows.length} members, ${projectRows.length} projects, ${assignments.size} assignments, ${taskCount} tasks, ${updateCount} daily updates.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
