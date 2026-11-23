import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
export const idParam = z.object({ id: uuidSchema });

/** Parse URL search params into a plain object (first value wins) for zod. */
export function queryObject(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  new URL(req.url).searchParams.forEach((v, k) => {
    if (!(k in out)) out[k] = v;
  });
  return out;
}

/** Comma-separated list -> array, e.g. ?status=todo,done */
export const csvList = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (typeof v === "string" ? v.split(",").filter(Boolean) : v), z.array(item));

export const boolParam = z.preprocess((v) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : v), z.boolean());
