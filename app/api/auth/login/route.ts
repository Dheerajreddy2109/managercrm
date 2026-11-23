import { fail, handle, ok, readJson } from "@/lib/api";
import { checkPassword, createSession } from "@/lib/auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/services/rateLimit";
import { loginSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export const POST = handle(async (req) => {
  const key = `login:${clientIp(req)}`;
  const { allowed, retryAfterSec } = rateLimit(key, MAX_ATTEMPTS, WINDOW_MS);
  if (!allowed) {
    const res = fail("Too many attempts. Try again later.", 429);
    res.headers.set("Retry-After", String(retryAfterSec));
    return res;
  }

  const { password } = loginSchema.parse(await readJson(req));
  if (!checkPassword(password)) {
    return fail("Incorrect password", 401);
  }

  resetRateLimit(key);
  await createSession();
  return ok({ loggedIn: true });
});

export const GET = () => fail("Method not allowed", 405);
