import { z } from "zod";
import { handle, ok, readJson } from "@/lib/api";
import { boolParam, idParam, queryObject } from "@/lib/validators/common";
import { updateProjectSchema } from "@/lib/validators/project";
import { deleteProject, getProject, updateProject } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deleteQuerySchema = z.object({
  hard: boolParam.optional(),
  status: z.enum(["completed", "cancelled"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = idParam.parse(await params);
  return ok(await getProject(id));
});

export const PATCH = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const input = updateProjectSchema.parse(await readJson(req));
  return ok(await updateProject(id, input));
});

/** DELETE archives (status=completed by default); ?hard=true deletes the project and all its tasks. */
export const DELETE = handle<Ctx>(async (req, { params }) => {
  const { id } = idParam.parse(await params);
  const { hard = false, status = "completed" } = deleteQuerySchema.parse(queryObject(req));
  if (hard) return ok(await deleteProject(id));
  return ok(await updateProject(id, { status }));
});
