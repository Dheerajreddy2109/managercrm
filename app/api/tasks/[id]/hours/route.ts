import { handle, ok, readJson } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { logHoursSchema } from "@/lib/validators/task";
import { logHours } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const { hours } = logHoursSchema.parse(await readJson(req));
  return ok(await logHours(id, hours));
});
