import { handle, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async () => ok({ status: "up", time: new Date().toISOString() }));
