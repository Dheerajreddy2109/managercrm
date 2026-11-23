import { handle, ok, readJson } from "@/lib/api";
import { bulkMoveSchema } from "@/lib/validators/task";
import { bulkMove } from "@/lib/services/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = handle(async (req) => ok(await bulkMove(bulkMoveSchema.parse(await readJson(req)))));
