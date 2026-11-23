import { handle } from "@/lib/api";
import { csvResponse, toCsv } from "@/lib/csv";
import { queryObject } from "@/lib/validators/common";
import { taskListQuerySchema } from "@/lib/validators/task";
import { listTasks } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Same filters as GET /api/tasks; returns a CSV download (up to 500 rows per the list limit). */
export const GET = handle(async (req) => {
  const q = taskListQuerySchema.parse({ limit: "500", includeDone: "true", ...queryObject(req) });
  const { items } = await listTasks(q);
  const rows = items.map((t) => ({
    id: t.id,
    title: t.title,
    project: t.project.name,
    milestone: t.milestone?.name ?? "",
    assignee: t.assignee?.name ?? "",
    status: t.status,
    priority: t.priority,
    estimatedHours: t.estimatedHours,
    actualHours: t.actualHours,
    dueDate: t.dueDate ?? "",
    overdue: t.overdue,
    tags: t.tags,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    createdAt: t.createdAt,
  }));
  const csv = toCsv(rows, [
    { key: "id", header: "ID" }, { key: "title", header: "Title" }, { key: "project", header: "Project" },
    { key: "milestone", header: "Milestone" }, { key: "assignee", header: "Assignee" }, { key: "status", header: "Status" },
    { key: "priority", header: "Priority" }, { key: "estimatedHours", header: "Estimated h" }, { key: "actualHours", header: "Actual h" },
    { key: "dueDate", header: "Due" }, { key: "overdue", header: "Overdue" }, { key: "tags", header: "Tags" },
    { key: "startedAt", header: "Started" }, { key: "completedAt", header: "Completed" }, { key: "createdAt", header: "Created" },
  ]);
  return csvResponse(csv, `tasks-${new Date().toISOString().slice(0, 10)}.csv`);
});
