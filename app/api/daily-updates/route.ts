import { handle, ok, readJson } from "@/lib/api";
import { queryObject } from "@/lib/validators/common";
import { dailyUpdatesQuerySchema, upsertDailyUpdateSchema } from "@/lib/validators/dailyUpdate";
import { getUpdatesForDate, getUpdatesRange, upsertDailyUpdate } from "@/lib/services/dailyUpdates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?date=YYYY-MM-DD (default today) -> all members with/without an update. GET ?from&to -> per-day ratios. */
export const GET = handle(async (req) => {
  const q = dailyUpdatesQuerySchema.parse(queryObject(req));
  if (q.from && q.to) return ok(await getUpdatesRange(q.from, q.to));
  return ok(await getUpdatesForDate(q.date));
});

/** POST upsert by (memberId, date). */
export const POST = handle(async (req) => {
  const input = upsertDailyUpdateSchema.parse(await readJson(req));
  return ok(await upsertDailyUpdate(input));
});
