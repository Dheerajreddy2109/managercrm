import { Suspense } from "react";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { DailyUpdatesClient } from "@/components/daily-updates/DailyUpdatesClient";
import { getUpdatesForDate, getUpdatesRange } from "@/lib/services/dailyUpdates";
import { todayInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

export default async function DailyUpdatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const today = todayInTz();
  const raw = Array.isArray(sp.date) ? sp.date[0] : sp.date;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
  const member = Array.isArray(sp.member) ? sp.member[0] : sp.member;
  const ws = startOfWeek(parseISO(date), { weekStartsOn: 1 });
  const [day, week] = await Promise.all([getUpdatesForDate(date), getUpdatesRange(format(ws, "yyyy-MM-dd"), format(addDays(ws, 6), "yyyy-MM-dd"))]);
  return (
    <>
      <PageHeader title="Daily updates" description="One standup entry per member per day. Hours roll into their tasks." />
      <Suspense fallback={null}><DailyUpdatesClient day={day} week={week} today={today} initialMember={member} /></Suspense>
    </>
  );
}
