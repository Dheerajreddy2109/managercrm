import { handle, ok, readJson } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { assignTaskSchema } from "@/lib/validators/task";
import { assignTask } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** POST { assigneeId | null } -> { task, assigneeAvailability, warning } */
export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const { assigneeId } = assignTaskSchema.parse(await readJson(req));
  return ok(await assignTask(id, assigneeId));
});
