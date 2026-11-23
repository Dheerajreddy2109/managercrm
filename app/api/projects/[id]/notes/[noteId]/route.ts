import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { uuidSchema } from "@/lib/validators/common";
import { deleteNote } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: uuidSchema, noteId: uuidSchema });
type Ctx = { params: Promise<{ id: string; noteId: string }> };

export const DELETE = handle<Ctx>(async (_req, ctx) => {
  const { id, noteId } = paramsSchema.parse(await ctx.params);
  return ok(await deleteNote(id, noteId));
});
