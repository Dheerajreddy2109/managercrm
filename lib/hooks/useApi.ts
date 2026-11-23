"use client";

import { toast } from "sonner";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; issues?: unknown };

/** fetch wrapper for client components: JSON in/out, toast on failure, throws on failure. */
export async function api<T>(url: string, init?: RequestInit & { json?: unknown; silent?: boolean }): Promise<T> {
  const { json, silent, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  let body: ApiResult<T>;
  try {
    body = (await res.json()) as ApiResult<T>;
  } catch {
    body = { ok: false, error: `Request failed (${res.status})` };
  }
  if (!body.ok) {
    if (!silent) toast.error(body.error);
    throw new Error(body.error);
  }
  return body.data;
}
