import { handle, ok } from "@/lib/api";
import { queryObject } from "@/lib/validators/common";
import { availabilityQuerySchema } from "@/lib/validators/member";
import { getTeamAvailability, resolveWeekStart } from "@/lib/services/availability";
import { format } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/availability?week=YYYY-MM-DD  -> team sorted by free hours (most free first). */
export const GET = handle(async (req) => {
  const { week } = availabilityQuerySchema.parse(queryObject(req));
  const data = await getTeamAvailability(week);
  return ok({ weekStart: format(resolveWeekStart(week), "yyyy-MM-dd"), members: data });
});
