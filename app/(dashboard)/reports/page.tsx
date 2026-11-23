import { Suspense } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReportsClient } from "@/components/reports/ReportsClient";
import { resolveWeekStart } from "@/lib/services/availability";
import { weeklyReport } from "@/lib/services/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.week) ? sp.week[0] : sp.week;
  const week = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  const [report, thisWeek] = [await weeklyReport(week), format(resolveWeekStart(), "yyyy-MM-dd")];
  return (
    <>
      <PageHeader title="Reports" description="Weekly status per project, ready to paste into Slack or email." />
      <Suspense fallback={null}><ReportsClient report={report} thisWeek={thisWeek} /></Suspense>
    </>
  );
}
