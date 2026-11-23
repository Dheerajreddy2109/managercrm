import { timingSafeEqual } from "node:crypto";
import { fail, handle, ok } from "@/lib/api";
import { storeDailyDigest } from "@/lib/services/digest";
import { todayInTz } from "@/lib/tz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vercel Cron hits this with `Authorization: Bearer ${CRON_SECRET}`. */
const authorized = (req: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const GET = handle(async (req) => {
  if (!process.env.CRON_SECRET) return fail("CRON_SECRET is not configured", 500);
  if (!authorized(req)) return fail("Unauthorized", 401);

  const result = await storeDailyDigest();
  return ok({ date: result.date, id: result.id, overdue: result.payload.overdue.length, blockers: result.payload.blockers.length, missingUpdates: result.payload.missingUpdates.length, generatedAt: todayInTz() });
});

export const POST = GET;
