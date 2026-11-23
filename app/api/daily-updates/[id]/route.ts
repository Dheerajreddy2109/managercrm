import { handle, ok } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { deleteDailyUpdate, getDailyUpdate } from "@/lib/services/dailyUpdates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => ok(await getDailyUpdate(idParam.parse(await params).id)));
export const DELETE = handle<Ctx>(async (_req, { params }) => ok(await deleteDailyUpdate(idParam.parse(await params).id)));
