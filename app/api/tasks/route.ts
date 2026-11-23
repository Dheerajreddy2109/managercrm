import { handle, ok, readJson } from "@/lib/api";
import { queryObject } from "@/lib/validators/common";
import { createTaskSchema, taskListQuerySchema } from "@/lib/validators/task";
import { createTask, listTasks } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => ok(await listTasks(taskListQuerySchema.parse(queryObject(req)))));

export const POST = handle(async (req) => {
  const input = createTaskSchema.parse(await readJson(req));
  return ok(await createTask(input), 201);
});
