import { handle, ok } from "@/lib/api";
import { idParam, queryObject } from "@/lib/validators/common";
import { memberUpdatesQuerySchema } from "@/lib/validators/dailyUpdate";
import { getUpdatesForMember } from "@/lib/services/dailyUpdates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const { from, to } = memberUpdatesQuerySchema.parse(queryObject(req));
  return ok(await getUpdatesForMember(id, from, to));
});
