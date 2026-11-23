import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProjectsStatus } from "@/components/home/ProjectsStatus";
import { EmployeesSection } from "@/components/home/EmployeesSection";
import { getHome } from "@/lib/services/home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { projects, employees } = await getHome();
  return (
    <>
      <PageHeader title="Home" description="Your projects and your team at a glance." />

      <h2 className="mb-2 text-sm font-semibold">Projects · {projects.length}</h2>
      {projects.length === 0
        ? <p className="mb-6 text-sm text-muted-foreground">No projects yet.</p>
        : <div className="mb-6"><ProjectsStatus projects={projects} /></div>}

      <h2 className="mb-2 text-sm font-semibold">Employees · {employees.length}</h2>
      {employees.length === 0 ? (
        <EmptyState icon={Users} title="No employees" description="Add people from the Team page." />
      ) : (
        <EmployeesSection employees={employees} />
      )}
    </>
  );
}
