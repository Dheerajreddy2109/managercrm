import { describe, expect, it } from "vitest";
import { z } from "zod";
import { HttpError, handle, notFound, ok, readJson } from "./api";

const req = (body?: unknown) =>
  new Request("http://localhost/api/x", {
    method: "POST",
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });

describe("handle()", () => {
  it("passes through a successful ok() response", async () => {
    const route = handle(async () => ok({ hello: "world" }, 201));
    const res = await route(req(), {});
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, data: { hello: "world" } });
  });

  it("maps ZodError to 422 with issues", async () => {
    const route = handle(async (r) => {
      z.object({ name: z.string() }).parse(await readJson(r));
      return ok(null);
    });
    const res = await route(req({ name: 42 }), {});
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it("maps HttpError to its status", async () => {
    const route = handle(async () => {
      throw notFound("Task");
    });
    const res = await route(req(), {});
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: "Task not found" });
  });

  it("maps malformed JSON to 400", async () => {
    const route = handle(async (r) => ok(await readJson(r)));
    const res = await route(req("{not json"), {});
    expect(res.status).toBe(400);
  });

  it("maps unknown errors to 500 without leaking the message", async () => {
    const route = handle(async () => {
      throw new Error("secret db string");
    });
    const res = await route(req(), {});
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "Internal server error" });
  });

  it("HttpError carries status", () => {
    expect(new HttpError(409, "conflict").status).toBe(409);
  });
});
