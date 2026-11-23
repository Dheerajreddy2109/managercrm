import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { queryObject } from "@/lib/validators/common";
import { getActivityFeed } from "@/lib/services/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const q = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(30),
  entityType: z.string().max(40).optional(),
  entityId: z.string().uuid().optional(),
});

export const GET = handle(async (req) => {
  const { limit, entityType, entityId } = q.parse(queryObject(req));
  return ok(await getActivityFeed(limit, entityType && entityId ? { type: entityType, id: entityId } : undefined));
});
