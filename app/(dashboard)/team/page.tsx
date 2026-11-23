import { Suspense } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { MemberDialog } from "@/components/team/MemberDialog";
import { TeamTable } from "@/components/team/TeamTable";
import { getTeamAvailability } from "@/lib/services/availability";
import { listMembers } from "@/lib/services/members";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const [members, availability] = await Promise.all([listMembers(), getTeamAvailability()]);
  const active = members.filter((m) => m.status !== "inactive").length;
  return (
    <>
      <PageHeader
        title="Team"
        description={`${active} active member${active === 1 ? "" : "s"} · availability is for this week`}
        actions={<Suspense fallback={null}><MemberDialog openOnQuery /></Suspense>}
      />
      <TeamTable members={members} availability={availability} />
    </>
  );
}
