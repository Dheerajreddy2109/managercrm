import { Suspense } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TasksPageClient } from "@/components/tasks/TasksPageClient";
import { listMembers } from "@/lib/services/members";
import { listProjects } from "@/lib/services/projects";
import { listTasks } from "@/lib/services/tasks";
import { taskListQuerySchema } from "@/lib/validators/task";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function TasksPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const get = (k: string) => first(sp[k]);
  const due = get("due");
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const parsed = taskListQuerySchema.safeParse({
    projectId: get("projectId"), assigneeId: get("assigneeId"), status: get("status"), priority: get("priority"),
    overdue: get("overdue"), unassigned: get("unassigned"), search: get("search"), tag: get("tag"),
    dueAfter: due === "week" ? format(weekStart, "yyyy-MM-dd") : due === "2w" ? format(new Date(), "yyyy-MM-dd") : undefined,
    dueBefore: due === "week" ? format(addDays(weekStart, 6), "yyyy-MM-dd") : due === "2w" ? format(addDays(new Date(), 14), "yyyy-MM-dd") : undefined,
    sort: get("sort") ?? "dueDate", order: get("order") ?? "asc", limit: "500",
  });
  const query = parsed.success ? parsed.data : taskListQuerySchema.parse({ sort: "dueDate", limit: "500" });
  const [tasks, projects, members] = await Promise.all([
    listTasks(query),
    listProjects({ includeClosed: false }),
    listMembers({}),
  ]);
  const active = get("overdue") === "true" ? "overdue" : get("unassigned") === "true" ? "unassigned" : due === "week" ? "week" : get("status") === "blocked" ? "blocked" : get("status") === "done" ? "done" : "";
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));
  const activeMembers = members.filter((m) => m.status !== "inactive").map((m) => ({ id: m.id, name: m.name }));

  return (
    <>
      <PageHeader title="Tasks" description="Every task across projects" actions={<Suspense fallback={null}><TaskDialog projects={projectOptions} openOnQuery /></Suspense>} />
      <Suspense fallback={null}>
        <TasksPageClient tasks={tasks.items} total={tasks.total} projects={projectOptions} members={activeMembers} active={active} />
      </Suspense>
    </>
  );
}
