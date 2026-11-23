import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { uuidSchema } from "@/lib/validators/common";
import { removeLeave } from "@/lib/services/members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const params = z.object({ id: uuidSchema, leaveId: uuidSchema });
type Ctx = { params: Promise<{ id: string; leaveId: string }> };

export const DELETE = handle<Ctx>(async (_req, ctx) => {
  const { id, leaveId } = params.parse(await ctx.params);
  return ok(await removeLeave(id, leaveId));
});
