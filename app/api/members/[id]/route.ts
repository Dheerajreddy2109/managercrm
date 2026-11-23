import { z } from "zod";
import { handle, ok, readJson } from "@/lib/api";
import { boolParam, idParam, queryObject } from "@/lib/validators/common";
import { updateMemberSchema } from "@/lib/validators/member";
import { getMember, removeMember, updateMember } from "@/lib/services/members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = idParam.parse(await params);
  return ok(await getMember(id));
});

export const PATCH = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const input = updateMemberSchema.parse(await readJson(req));
  return ok(await updateMember(id, input));
});

export const DELETE = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const { hard = false } = z.object({ hard: boolParam.optional() }).parse(queryObject(req));
  return ok(await removeMember(id, hard));
});
