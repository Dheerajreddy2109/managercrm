import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = { ok: false; error: string; issues?: unknown };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, { status });
}

export function fail(message: string, status = 400, issues?: unknown) {
  return NextResponse.json<ApiFail>({ ok: false, error: message, issues }, { status });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const notFound = (what = "Resource") => new HttpError(404, `${what} not found`);

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

/**
 * Wraps a route handler so every route returns the same JSON shape.
 * ZodError -> 422, HttpError -> its status, anything else -> 500.
 */
export function handle<Ctx = unknown>(fn: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail("Validation failed", 422, err.issues);
      }
      if (err instanceof HttpError) {
        return fail(err.message, err.status);
      }
      console.error("[api]", err);
      return fail("Internal server error", 500);
    }
  };
}

/** Parse JSON body safely; throws HttpError(400) on malformed JSON. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}
