import { handle, ok } from "@/lib/api";
import { idParam } from "@/lib/validators/common";
import { getProjectProgress } from "@/lib/services/progress";
import { ensureProject } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = idParam.parse(await params);
  await ensureProject(id);
  return ok(await getProjectProgress(id));
});
