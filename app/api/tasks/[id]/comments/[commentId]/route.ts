import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { uuidSchema } from "@/lib/validators/common";
import { removeComment } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: uuidSchema, commentId: uuidSchema });
type Ctx = { params: Promise<{ id: string; commentId: string }> };

export const DELETE = handle<Ctx>(async (_req, ctx) => {
  const { id, commentId } = paramsSchema.parse(await ctx.params);
  return ok(await removeComment(id, commentId));
});
