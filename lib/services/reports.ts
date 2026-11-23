import { format, addDays } from "date-fns";
import { getTeamAvailability, resolveWeekStart } from "./availability";
import { weeklyDigest } from "./dailyUpdates";
import { listProjects } from "./projects";

/** Weekly report = digest + current progress per project + team utilisation for that week. */
export async function weeklyReport(week?: string) {
  const weekStart = resolveWeekStart(week);
  const ws = format(weekStart, "yyyy-MM-dd");
  const [digest, projects, team] = await Promise.all([weeklyDigest(ws), listProjects({ includeClosed: true }), getTeamAvailability(ws)]);
  const byId = new Map(projects.map((p) => [p.id, p]));
  const rows = digest.projects
    .map((d) => {
      const p = byId.get(d.project.id);
      if (!p) return null;
      return { ...d, project: p, progress: p.progress, healthAuto: p.healthAuto };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { weekStart: ws, weekEnd: format(addDays(weekStart, 6), "yyyy-MM-dd"), projects: rows, blockers: digest.blockers, team };
}

export type WeeklyReport = Awaited<ReturnType<typeof weeklyReport>>;

/** Slack/email-ready Markdown for one project card. */
export function projectReportMarkdown(r: WeeklyReport["projects"][number], weekStart: string, weekEnd: string) {
  const p = r.project;
  const lines: string[] = [];
  lines.push(`*${p.name}* — week ${weekStart} → ${weekEnd}`);
  lines.push(`Status: ${p.status.replace("_", " ")} · Health: ${p.health}${r.healthAuto !== p.health ? ` (data suggests ${r.healthAuto})` : ""} · Progress: ${r.progress.percent}% (${r.progress.doneTasks}/${r.progress.totalTasks} tasks)`);
  if (p.targetEndDate) lines.push(`Target end: ${p.targetEndDate}`);
  lines.push("");
  lines.push(`✅ Done this week (${r.doneThisWeek.length})`);
  for (const t of r.doneThisWeek) lines.push(`• ${t.title}`);
  if (r.doneThisWeek.length === 0) lines.push("• —");
  lines.push("");
  lines.push(`🔄 In progress (${r.inProgress.length})`);
  for (const t of r.inProgress) lines.push(`• ${t.title}${t.status === "in_review" ? " (in review)" : ""}`);
  if (r.inProgress.length === 0) lines.push("• —");
  if (r.blocked.length) { lines.push(""); lines.push(`⛔ Blocked (${r.blocked.length})`); for (const t of r.blocked) lines.push(`• ${t.title}`); }
  if (r.overdue.length) { lines.push(""); lines.push(`⚠️ Overdue (${r.overdue.length})`); for (const t of r.overdue) lines.push(`• ${t.title} (due ${t.dueDate})`); }
  if (r.dueNextWeek.length) { lines.push(""); lines.push(`📅 Next week (${r.dueNextWeek.length})`); for (const t of r.dueNextWeek) lines.push(`• ${t.title} (${t.dueDate})`); }
  lines.push("");
  lines.push(`⏱ Hours logged: ${r.hoursLogged}h`);
  return lines.join("\n");
}
