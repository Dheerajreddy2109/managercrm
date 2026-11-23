import { handle, ok } from "@/lib/api";
import { queryObject } from "@/lib/validators/common";
import { weekQuerySchema } from "@/lib/validators/dailyUpdate";
import { weeklyDigest } from "@/lib/services/dailyUpdates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?week=YYYY-MM-DD (any day in the week; defaults to this week). */
export const GET = handle(async (req) => ok(await weeklyDigest(weekQuerySchema.parse(queryObject(req)).week)));
