import { handle, ok, readJson } from "@/lib/api";
import { queryObject } from "@/lib/validators/common";
import { createProjectSchema, projectListQuerySchema } from "@/lib/validators/project";
import { createProject, listProjects } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const q = projectListQuerySchema.parse(queryObject(req));
  return ok(await listProjects({ ...q, includeClosed: q.includeClosed === "true" }));
});

export const POST = handle(async (req) => {
  const input = createProjectSchema.parse(await readJson(req));
  return ok(await createProject(input), 201);
});
