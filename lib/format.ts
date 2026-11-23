import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns";

export const fmtDate = (d: string | Date | null | undefined, f = "d MMM") => (d ? format(typeof d === "string" ? parseISO(d) : d, f) : "—");
export const fmtDateLong = (d: string | Date | null | undefined) => fmtDate(d, "EEE, d MMM yyyy");
export const fmtAgo = (d: string | Date) => formatDistanceToNowStrict(typeof d === "string" ? new Date(d) : d, { addSuffix: true });
export const fmtHours = (h: number | null | undefined) => `${Math.round((h ?? 0) * 10) / 10}h`;
/** Client-safe "today" (browser local time). Server code should use lib/tz. */
export const todayStr = () => format(new Date(), "yyyy-MM-dd");

/** "3d overdue" / "due today" / "in 5d" */
export function dueLabel(dueDate: string | null | undefined, done = false): { text: string; tone: "danger" | "warn" | "muted" } {
  if (!dueDate) return { text: "No due date", tone: "muted" };
  if (done) return { text: fmtDate(dueDate), tone: "muted" };
  const diff = differenceInCalendarDays(parseISO(dueDate), new Date());
  if (diff < 0) return { text: `${-diff}d overdue`, tone: "danger" };
  if (diff === 0) return { text: "Due today", tone: "warn" };
  if (diff <= 2) return { text: `Due in ${diff}d`, tone: "warn" };
  return { text: fmtDate(dueDate), tone: "muted" };
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
