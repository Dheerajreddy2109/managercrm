import { handle, ok, readJson } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { commentSchema } from "@/lib/validators/task";
import { addComment, listComments } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => ok(await listComments(idParam.parse(await params).id)));

export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const { body } = commentSchema.parse(await readJson(req));
  return ok(await addComment(id, body), 201);
});
