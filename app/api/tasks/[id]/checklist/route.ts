import { handle, ok, readJson } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { checklistItemSchema } from "@/lib/validators/task";
import { addChecklistItem, listChecklist } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => ok(await listChecklist(idParam.parse(await params).id)));

export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const { text } = checklistItemSchema.parse(await readJson(req));
  return ok(await addChecklistItem(id, text), 201);
});
