"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AvailabilityBadge, CapacityBar } from "@/components/shared/AvailabilityBadge";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { NativeSelect } from "@/components/shared/NativeSelect";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { MEMBER_ROLES } from "@/lib/db/schema";
import { titleCase } from "@/lib/format";
import type { MemberAvailability } from "@/lib/services/availability";
import type { listMembers } from "@/lib/services/members";

type MemberRow = Awaited<ReturnType<typeof listMembers>>[number];

export function TeamTable({ members, availability }: { members: MemberRow[]; availability: MemberAvailability[] }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const avail = useMemo(() => new Map(availability.map((a) => [a.member.id, a])), [availability]);

  const rows = members.filter((m) => {
    if (role && m.role !== role) return false;
    if (status ? m.status !== status : m.status === "inactive") return false;
    if (q) {
      const hay = `${m.name} ${m.email ?? ""} ${m.skills.join(" ")}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, email, skill" value={q} onChange={(e) => setQ(e.target.value)} className="w-56 pl-7" />
        </div>
        <NativeSelect value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {MEMBER_ROLES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
        </NativeSelect>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Active + on leave</option>
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="inactive">Inactive</option>
        </NativeSelect>
        <span className="ml-auto text-xs text-muted-foreground">{rows.length} member{rows.length === 1 ? "" : "s"}</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No members match" description="Try clearing the filters." />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden md:table-cell">Skills</TableHead>
                <TableHead className="w-56">This week</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="hidden lg:table-cell">Projects</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => {
                const a = avail.get(m.id);
                return (
                  <TableRow key={m.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/team/${m.id}`} className="flex items-center gap-2">
                        <MemberAvatar name={m.name} color={m.avatarColor} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium hover:underline">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground">{titleCase(m.role)} · {m.weeklyCapacityHours}h/wk</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {m.skills.slice(0, 4).map((s) => <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{s}</span>)}
                        {m.skills.length > 4 && <span className="text-[11px] text-muted-foreground">+{m.skills.length - 4}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between"><AvailabilityBadge badge={a.badge} /><span className="text-[11px] text-muted-foreground">{a.freeHours}h free</span></div>
                          <CapacityBar capacity={a.capacityHours} committed={a.committedHours} leave={a.leaveHours} />
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{m.openTasks}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(a?.projects ?? []).map((p) => <Link key={p.id} href={`/projects/${p.id}`} className="rounded border px-1.5 py-0.5 text-[11px] hover:bg-muted">{p.name}</Link>)}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={m.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
