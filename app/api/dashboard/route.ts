import { handle, ok } from "@/lib/api";
import { getDashboard } from "@/lib/services/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One call returns overview counters, project summaries, workload, upcoming, overdue and recent activity. */
export const GET = handle(async () => ok(await getDashboard()));
