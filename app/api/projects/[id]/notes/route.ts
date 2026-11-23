import { handle, ok, readJson } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { createNoteSchema } from "@/lib/validators/project";
import { createNote, listNotes } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = idParam.parse(await params);
  return ok(await listNotes(id));
});

export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const input = createNoteSchema.parse(await readJson(req));
  return ok(await createNote(id, input), 201);
});
