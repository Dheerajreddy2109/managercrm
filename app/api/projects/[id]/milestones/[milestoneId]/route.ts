import { z } from "zod";
import { handle, ok, readJson } from "@/lib/api";
import { uuidSchema } from "@/lib/validators/common";
import { updateMilestoneSchema } from "@/lib/validators/project";
import { deleteMilestone, updateMilestone } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: uuidSchema, milestoneId: uuidSchema });
type Ctx = { params: Promise<{ id: string; milestoneId: string }> };

export const PATCH = handle<Ctx>(async (req, ctx) => {
  const { id, milestoneId } = paramsSchema.parse(await ctx.params);
  const input = updateMilestoneSchema.parse(await readJson(req));
  return ok(await updateMilestone(id, milestoneId, input));
});

export const DELETE = handle<Ctx>(async (_req, ctx) => {
  const { id, milestoneId } = paramsSchema.parse(await ctx.params);
  return ok(await deleteMilestone(id, milestoneId));
});
