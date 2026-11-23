import { handle, ok, readJson } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { createMilestoneSchema } from "@/lib/validators/project";
import { createMilestone, listMilestones } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = idParam.parse(await params);
  return ok(await listMilestones(id));
});

export const POST = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const input = createMilestoneSchema.parse(await readJson(req));
  return ok(await createMilestone(id, input), 201);
});
