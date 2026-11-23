import { z } from "zod";
import { handle, ok, readJson } from "@/lib/api";
import { uuidSchema } from "@/lib/validators/common";
import { updateProjectMemberSchema } from "@/lib/validators/project";
import { removeProjectMember, updateProjectMember } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: uuidSchema, memberId: uuidSchema });
type Ctx = { params: Promise<{ id: string; memberId: string }> };

export const PATCH = handle<Ctx>(async (req, ctx) => {
  const { id, memberId } = paramsSchema.parse(await ctx.params);
  const input = updateProjectMemberSchema.parse(await readJson(req));
  return ok(await updateProjectMember(id, memberId, input));
});

export const DELETE = handle<Ctx>(async (_req, ctx) => {
  const { id, memberId } = paramsSchema.parse(await ctx.params);
  return ok(await removeProjectMember(id, memberId));
});
