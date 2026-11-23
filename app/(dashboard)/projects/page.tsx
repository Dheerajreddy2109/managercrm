import { Suspense } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { listProjects } from "@/lib/services/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects({ includeClosed: true });
  const open = projects.filter((p) => p.status !== "completed" && p.status !== "cancelled").length;
  return (
    <>
      <PageHeader title="Projects" description={`${open} open · ${projects.length - open} closed`} actions={<Suspense fallback={null}><ProjectDialog openOnQuery /></Suspense>} />
      <ProjectsList projects={projects} />
    </>
  );
}
