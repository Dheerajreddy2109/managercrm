import { handle, ok, readJson } from "@/lib/api";
import { queryObject } from "@/lib/validators/common";
import { createMemberSchema, memberListQuerySchema } from "@/lib/validators/member";
import { createMember, listMembers } from "@/lib/services/members";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const filters = memberListQuerySchema.parse(queryObject(req));
  return ok(await listMembers(filters));
});

export const POST = handle(async (req) => {
  const input = createMemberSchema.parse(await readJson(req));
  return ok(await createMember(input), 201);
});
