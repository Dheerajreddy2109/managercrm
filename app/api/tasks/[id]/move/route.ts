import { handle, ok, readJson } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { moveTaskSchema } from "@/lib/validators/task";
import { moveTask } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const { status, sortOrder } = moveTaskSchema.parse(await readJson(req));
  return ok(await moveTask(id, status, sortOrder));
});
