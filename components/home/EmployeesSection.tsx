"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmployeeCard } from "./EmployeeCard";
import type { getHome } from "@/lib/services/home";

type E = Awaited<ReturnType<typeof getHome>>["employees"][number];

export function EmployeesSection({ employees }: { employees: E[] }) {
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const shown = employees.filter((e) => !n || e.name.toLowerCase().includes(n) || e.skills.some((s) => s.includes(n)) || e.projects.some((p) => p.name.toLowerCase().includes(n)));
  return (
    <div>
      <div className="relative mb-2 w-full sm:w-72">
        <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employee, skill or project" className="h-8 pl-7 text-xs" />
      </div>
      {shown.length === 0 ? <p className="text-sm text-muted-foreground">No employees match.</p> : (
        <div className="grid gap-4 lg:grid-cols-2">{shown.map((e) => <EmployeeCard key={e.id} e={e} />)}</div>
      )}
    </div>
  );
}
