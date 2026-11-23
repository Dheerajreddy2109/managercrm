import { asc, desc, gte, ne, or } from "drizzle-orm";
import { format, subDays } from "date-fns";
import { db } from "@/lib/db";
import { dailyUpdates, members, tasks } from "@/lib/db/schema";
import { nowInTz } from "@/lib/tz";
import { listProjects } from "./projects";

const STATUS_ORDER = { active: 0, on_hold: 1, planning: 2, completed: 3, cancelled: 4 } as const;

/** Home page: every project (status, hold reason, progress) and every employee with projects, open tasks, recent daily updates. */
export async function getHome(days = 30) {
  const from = format(subDays(nowInTz(), days - 1), "yyyy-MM-dd");
  const [projectRows, memberRows, openTasks, updates] = await Promise.all([
    listProjects({ includeClosed: true }),
    db.select({ id: members.id, name: members.name, role: members.role, skills: members.skills, avatarColor: members.avatarColor, status: members.status, device: members.device, deviceSpecs: members.deviceSpecs, deviceIssues: members.deviceIssues, availableFrom: members.availableFrom, availableUntil: members.availableUntil })
      .from(members).where(ne(members.status, "inactive")).orderBy(asc(members.name)),
    db.query.tasks.findMany({
      where: or(ne(tasks.status, "done"), gte(tasks.completedAt, new Date(`${from}T00:00:00Z`))),
      orderBy: [asc(tasks.status), asc(tasks.dueDate)],
      columns: { id: true, title: true, description: true, status: true, dueDate: true, estimatedHours: true, projectId: true, assigneeId: true, completedAt: true },
      with: {
        checklist: { columns: { id: true, text: true, isDone: true }, orderBy: (c, { asc }) => [asc(c.sortOrder)] },
        comments: { columns: { id: true, body: true }, orderBy: (c, { asc }) => [asc(c.createdAt)] },
      },
    }),
    db.query.dailyUpdates.findMany({
      where: gte(dailyUpdates.date, from),
      orderBy: desc(dailyUpdates.date),
      with: { tasks: { with: { task: { columns: { id: true, title: true, status: true } } } } },
    }),
  ]);

  const projectName = new Map(projectRows.map((p) => [p.id, p.name]));
  const employees = memberRows.map((m) => ({
    ...m,
    projects: projectRows
      .filter((p) => p.members.some((pm) => pm.id === m.id))
      .map((p) => {
        const a = p.members.find((pm) => pm.id === m.id)!.assignment;
        return { id: p.id, name: p.name, status: a.status ?? p.status, priority: a.priority, dueDate: a.dueDate, percent: a.percent, tech: a.tech, notes: a.notes };
      })
      .sort((x, y) => STATUS_ORDER[x.status] - STATUS_ORDER[y.status] || x.name.localeCompare(y.name)),
    openTasks: openTasks
      .filter((t) => t.assigneeId === m.id)
      .map((t) => ({ ...t, projectName: projectName.get(t.projectId) ?? "" })),
    updates: updates
      .filter((u) => u.memberId === m.id)
      .map((u) => ({ id: u.id, date: u.date, summary: u.summary, blockers: u.blockers, tasks: u.tasks.map((t) => t.task) })),
  }));

  const order = STATUS_ORDER;
  const projectsOut = [...projectRows]
    .sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name))
    .map((p) => ({
      id: p.id, name: p.name, client: p.client, status: p.status, holdReason: p.holdReason,
      priority: p.priority, techStack: p.techStack, description: p.description, targetEndDate: p.targetEndDate,
      percent: p.status === "completed" ? 100 : p.progress.percent,
      doneTasks: p.progress.doneTasks, totalTasks: p.progress.totalTasks,
      people: p.members.map((m) => ({ id: m.id, name: m.name, status: m.assignment.status, notes: m.assignment.notes, percent: m.assignment.percent, tech: m.assignment.tech, role: m.projectRole })),
    }));

  return { projects: projectsOut, employees, from };
}
