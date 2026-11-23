import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "pm_session";
const SESSION_DAYS = 30;

function secretKey(secret = process.env.SESSION_SECRET) {
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

/** Sign a session token. Exported separately so it can be unit-tested without Next's cookie store. */
export async function signSessionToken(secret?: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + SESSION_DAYS * 24 * 60 * 60;
  return new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(exp)
    .sign(secretKey(secret));
}

export async function verifySessionToken(token: string | undefined, secret?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), { algorithms: ["HS256"] });
    return payload.sub === "owner";
  } catch {
    return false;
  }
}

/** Constant-time password check against APP_PASSWORD. */
export function checkPassword(candidate: string, expected = process.env.APP_PASSWORD): boolean {
  if (!expected) return false;
  const a = new TextEncoder().encode(candidate);
  const b = new TextEncoder().encode(expected);
  // Compare full length of the longer one so timing does not leak length.
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

/** Create a session: signs a token and sets the cookie (route handlers / server actions only). */
export async function createSession() {
  const token = await signSessionToken();
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

/** Verify the session from a NextRequest (proxy) or from the server cookie store (RSC / route handlers). */
export async function verifySession(request?: NextRequest): Promise<boolean> {
  const token = request ? request.cookies.get(SESSION_COOKIE)?.value : (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}
