import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { AvatarStack } from "@/components/shared/MemberAvatar";
import { HealthDot, HealthLabel } from "@/components/shared/HealthDot";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { ProgressEditor } from "@/components/projects/ProgressEditor";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { HttpError } from "@/lib/api";
import { fmtDate, fmtHours } from "@/lib/format";
import { projectDisplay } from "@/lib/projectDisplay";
import { getProject } from "@/lib/services/projects";
import { listTasks } from "@/lib/services/tasks";
import { taskListQuerySchema } from "@/lib/validators/task";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let project: Awaited<ReturnType<typeof getProject>>;
  try { project = await getProject(id); } catch (e) { if (e instanceof HttpError && e.status === 404) notFound(); throw e; }
  const tasks = await listTasks(taskListQuerySchema.parse({ projectId: id, includeDone: "true", limit: "500" }));
  const p = project.progress;
  const d = projectDisplay(project);

  return (
    <>
      <Link href="/projects" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ChevronLeft className="size-3" /> Projects</Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <HealthDot health={project.health} />
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} showLabel />
            <HealthLabel health={project.health} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {project.client && <span>{project.client}</span>}
            {(project.startDate || project.targetEndDate) && <span>{fmtDate(project.startDate, "d MMM yyyy")} → {fmtDate(project.targetEndDate, "d MMM yyyy")}</span>}
            {project.techStack.length > 0 && <span>{project.techStack.join(" · ")}</span>}
          </div>
          <div className="mt-2 flex max-w-xl items-center gap-3">
            <ProgressEditor projectId={project.id} percent={d.percent} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{d.completed ? (d.openTasks ? `Completed · ${d.openTasks} task${d.openTasks === 1 ? "" : "s"} left open` : "Completed · all tasks done") : <>{p.doneTasks}/{p.totalTasks} tasks · {fmtHours(p.doneHours)}/{fmtHours(p.totalHours)}</>}</span>
            {d.overdue > 0 && <span className="text-xs font-medium text-red-600 whitespace-nowrap">{d.overdue} overdue</span>}
            {d.blocked > 0 && <span className="text-xs font-medium text-amber-600 whitespace-nowrap">{d.blocked} blocked</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack people={project.members} />
          <Suspense fallback={null}><ProjectDialog initial={project} openTaskCount={p.totalTasks - p.doneTasks} trigger={<Button variant="outline" size="sm"><Pencil className="size-3.5" /> Edit project</Button>} /></Suspense>
          <Suspense fallback={null}><TaskDialog projects={[{ id: project.id, name: project.name, milestones: project.milestones }]} defaultProjectId={project.id} /></Suspense>
        </div>
      </div>
      <Suspense fallback={null}><ProjectTabs project={project} tasks={tasks.items} /></Suspense>
    </>
  );
}
