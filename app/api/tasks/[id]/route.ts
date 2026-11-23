import { handle, ok, readJson } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { updateTaskSchema } from "@/lib/validators/task";
import { deleteTask, getTask, updateTask } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => ok(await getTask(idParam.parse(await params).id)));

export const PATCH = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  return ok(await updateTask(id, updateTaskSchema.parse(await readJson(req))));
});

export const DELETE = handle<Ctx>(async (_req, { params }) => ok(await deleteTask(idParam.parse(await params).id)));
