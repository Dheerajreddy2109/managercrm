import { z } from "zod";
import { handle, ok, readJson } from "@/lib/api";
import { uuidSchema } from "@/lib/validators/common";
import { updateChecklistItemSchema } from "@/lib/validators/task";
import { removeChecklistItem, updateChecklistItem } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: uuidSchema, itemId: uuidSchema });
type Ctx = { params: Promise<{ id: string; itemId: string }> };

export const PATCH = handle<Ctx>(async (req, ctx) => {
  const { id, itemId } = paramsSchema.parse(await ctx.params);
  return ok(await updateChecklistItem(id, itemId, updateChecklistItemSchema.parse(await readJson(req))));
});

export const DELETE = handle<Ctx>(async (_req, ctx) => {
  const { id, itemId } = paramsSchema.parse(await ctx.params);
  return ok(await removeChecklistItem(id, itemId));
});
