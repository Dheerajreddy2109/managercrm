import { handle, ok, readJson } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { addProjectMemberSchema } from "@/lib/validators/project";
import { addProjectMember, listProjectMembers } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = idParam.parse(await params);
  return ok(await listProjectMembers(id));
});

export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const input = addProjectMemberSchema.parse(await readJson(req));
  return ok(await addProjectMember(id, input), 201);
});
