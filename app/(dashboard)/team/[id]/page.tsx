import Link from "next/link";
import { notFound } from "next/navigation";
import { format, subDays } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailabilityBadge, CapacityBar } from "@/components/shared/AvailabilityBadge";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HealthDot } from "@/components/shared/HealthDot";
import { LeavesManager } from "@/components/team/LeavesManager";
import { MemberHeaderActions } from "@/components/team/MemberHeader";
import { MemberTasks } from "@/components/team/MemberTasks";
import { MemberUpdates } from "@/components/team/MemberUpdates";
import { HttpError } from "@/lib/api";
import { fmtHours, titleCase, todayStr } from "@/lib/format";
import { getMemberAvailability } from "@/lib/services/availability";
import { getUpdatesForMember } from "@/lib/services/dailyUpdates";
import { getMember } from "@/lib/services/members";
import { listTasks } from "@/lib/services/tasks";
import { taskListQuerySchema } from "@/lib/validators/task";

export const dynamic = "force-dynamic";

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let member: Awaited<ReturnType<typeof getMember>>;
  try {
    member = await getMember(id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  const from = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const [availability, tasks, updates] = await Promise.all([
    member.status === "inactive" ? null : getMemberAvailability(id).catch(() => null),
    listTasks(taskListQuerySchema.parse({ assigneeId: id, includeDone: "true", sort: "dueDate", limit: "500" })),
    getUpdatesForMember(id, from, todayStr()),
  ]);
  const open = tasks.items.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.overdue).length;

  return (
    <>
      <Link href="/team" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ChevronLeft className="size-3" /> Team</Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <MemberAvatar name={member.name} color={member.avatarColor} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{member.name}</h1>
              <StatusBadge status={member.status} />
              {availability && <AvailabilityBadge badge={availability.badge} />}
            </div>
            <div className="text-sm text-muted-foreground">
              {titleCase(member.role)} · {member.weeklyCapacityHours}h/week{member.email && <> · <a href={`mailto:${member.email}`} className="hover:underline">{member.email}</a></>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2"><MemberHeaderActions member={member} /></div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks <span className="ml-1 text-muted-foreground">{open.length}</span></TabsTrigger>
          <TabsTrigger value="updates">Daily updates</TabsTrigger>
          <TabsTrigger value="leaves">Leave <span className="ml-1 text-muted-foreground">{member.leaves.length}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3">
          <div className="grid gap-4 md:grid-cols-3">
            <section className="rounded-lg border p-3 md:col-span-2">
              <h2 className="mb-2 text-sm font-medium">This week</h2>
              {availability ? (
                <>
                  <CapacityBar capacity={availability.capacityHours} committed={availability.committedHours} leave={availability.leaveHours} />
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div><dt className="text-xs text-muted-foreground">Free</dt><dd className="font-medium">{fmtHours(availability.freeHours)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Committed</dt><dd className="font-medium">{fmtHours(availability.committedHours)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Leave</dt><dd className="font-medium">{fmtHours(availability.leaveHours)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Utilisation</dt><dd className="font-medium">{availability.utilizationPercent}%</dd></div>
                  </dl>
                </>
              ) : <p className="text-sm text-muted-foreground">Inactive members are excluded from availability.</p>}
              <div className="mt-3 flex gap-4 text-sm">
                <span>{open.length} open task{open.length === 1 ? "" : "s"}</span>
                {overdue > 0 && <span className="text-red-600">{overdue} overdue</span>}
              </div>
            </section>
            <section className="rounded-lg border p-3">
              <h2 className="mb-2 text-sm font-medium">Projects</h2>
              {member.projects.length === 0 ? <p className="text-sm text-muted-foreground">Not on any project.</p> : (
                <ul className="space-y-1.5">
                  {member.projects.map((p) => (
                    <li key={p.id}>
                      <Link href={`/projects/${p.id}`} className="flex items-center gap-2 text-sm hover:underline">
                        <HealthDot health={p.health} size="sm" />
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-[11px] text-muted-foreground">{p.projectRole ?? titleCase(member.role)} · {p.allocationPercent}%</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {member.skills.length > 0 && (
                <>
                  <h2 className="mt-4 mb-2 text-sm font-medium">Skills</h2>
                  <div className="flex flex-wrap gap-1">{member.skills.map((s) => <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{s}</span>)}</div>
                </>
              )}
              {(member.device || member.deviceSpecs || member.deviceIssues) && <><h2 className="mt-4 mb-1 text-sm font-medium">Device</h2><p className="text-sm text-muted-foreground">{[member.device, member.deviceSpecs].filter(Boolean).join(" · ")}{member.deviceIssues && <span className="block text-amber-600 dark:text-amber-400">⚠ {member.deviceIssues}</span>}</p></>}
              {(member.availableFrom || member.availableUntil) && <><h2 className="mt-4 mb-1 text-sm font-medium">Availability</h2><p className="text-sm text-muted-foreground">{member.availableFrom ? `From ${member.availableFrom}` : ""}{member.availableUntil ? ` until ${member.availableUntil}` : ""}</p></>}
              {member.notes && <><h2 className="mt-4 mb-1 text-sm font-medium">Notes</h2><p className="text-sm whitespace-pre-wrap text-muted-foreground">{member.notes}</p></>}
            </section>
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="mt-3"><MemberTasks tasks={tasks.items} /></TabsContent>
        <TabsContent value="updates" className="mt-3"><MemberUpdates updates={updates} /></TabsContent>
        <TabsContent value="leaves" className="mt-3"><LeavesManager memberId={member.id} leaves={member.leaves} /></TabsContent>
      </Tabs>
    </>
  );
}
