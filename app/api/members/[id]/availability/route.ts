import { handle, ok } from "@/lib/api";
import { idParam, queryObject } from "@/lib/validators/common";
import { availabilityQuerySchema } from "@/lib/validators/member";
import { getMemberAvailability } from "@/lib/services/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const { week } = availabilityQuerySchema.parse(queryObject(req));
  return ok(await getMemberAvailability(id, week));
});
