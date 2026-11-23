import { and, eq, gte, inArray, lte, ne, notInArray } from "drizzle-orm";
import { addDays, format, parseISO } from "date-fns";
import { db } from "@/lib/db";
import { memberLeaves, members, projectMembers, projects, tasks } from "@/lib/db/schema";
import { HttpError } from "@/lib/api";
import { nowInTz } from "@/lib/tz";
import { computeAvailability, weekStartOf, type AvailabilityResult } from "./availability.calc";

export type MemberAvailability = AvailabilityResult & {
  member: { id: string; name: string; role: string; avatarColor: string; status: string; weeklyCapacityHours: number };
  projects: { id: string; name: string }[];
};

export function resolveWeekStart(week?: string) {
  return weekStartOf(week ? parseISO(week) : nowInTz());
}

/**
 * Availability for every non-inactive member for a week (default: current week).
 * Four queries total regardless of team size: members, tasks, leaves, project memberships.
 */
export async function getTeamAvailability(week?: string, memberIds?: string[]): Promise<MemberAvailability[]> {
  const weekStart = resolveWeekStart(week);
  const ws = format(weekStart, "yyyy-MM-dd");
  const weekEndInclusive = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const memberRows = await db
    .select({
      id: members.id,
      name: members.name,
      role: members.role,
      avatarColor: members.avatarColor,
      status: members.status,
      weeklyCapacityHours: members.weeklyCapacityHours,
    })
    .from(members)
    .where(and(ne(members.status, "inactive"), memberIds ? inArray(members.id, memberIds) : undefined));
  if (memberRows.length === 0) return [];
  const ids = memberRows.map((m) => m.id);

  const [taskRows, leaveRows, projRows] = await Promise.all([
    db
      .select({
        assigneeId: tasks.assigneeId,
        status: tasks.status,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        dueDate: tasks.dueDate,
      })
      .from(tasks)
      .where(and(inArray(tasks.assigneeId, ids), ne(tasks.status, "done"))),
    db
      .select({ memberId: memberLeaves.memberId, startDate: memberLeaves.startDate, endDate: memberLeaves.endDate })
      .from(memberLeaves)
      .where(and(inArray(memberLeaves.memberId, ids), lte(memberLeaves.startDate, weekEndInclusive), gte(memberLeaves.endDate, ws))),
    db
      .select({ memberId: projectMembers.memberId, id: projects.id, name: projects.name })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(and(inArray(projectMembers.memberId, ids), notInArray(projects.status, ["completed", "cancelled"]))),
  ]);

  const projectsByMember = new Map<string, { id: string; name: string }[]>();
  for (const r of projRows) {
    const list = projectsByMember.get(r.memberId) ?? [];
    list.push({ id: r.id, name: r.name });
    projectsByMember.set(r.memberId, list);
  }

  const today = new Date();
  return memberRows
    .map((m) => ({
      ...computeAvailability(m, taskRows, leaveRows, weekStart, today),
      member: m,
      projects: projectsByMember.get(m.id) ?? [],
    }))
    .sort((a, b) => b.freeHours - a.freeHours || a.member.name.localeCompare(b.member.name));
}

export async function getMemberAvailability(memberId: string, week?: string): Promise<MemberAvailability> {
  const [row] = await getTeamAvailability(week, [memberId]);
  if (!row) throw new HttpError(404, "Member not found or inactive");
  return row;
}
