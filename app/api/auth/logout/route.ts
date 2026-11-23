import { handle, ok } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async () => {
  await destroySession();
  return ok({ loggedOut: true });
});
