import { PROJECT_ALIASES, type SheetStatus } from "./team";

type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
type Priority = "low" | "medium" | "high" | "urgent";

/** "Visakhavalley", "visaka vally" → "Visakha Valley"; unknown names are kept, tidied. */
export function canonProject(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (PROJECT_ALIASES[key]) return PROJECT_ALIASES[key];
  const t = name.trim().replace(/\s+/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function mapStatus(s: SheetStatus): ProjectStatus | null {
  return ({ Ongoing: "active", "On Hold": "on_hold", Completed: "completed", Upcoming: "planning", "": null } as const)[s];
}

export function mapPriority(p: string): Priority | null {
  return ({ High: "high", Medium: "medium", Low: "low" } as Record<string, Priority>)[p] ?? null;
}

/** "2 hours"→2, "30 mins"→0.5, "2 and half"→2.5, "one day"→8, "2 days"→16; "eod"/"?"/"" → null (kept as text). */
export function parseEstimate(raw: string): number | null {
  const s = raw.toLowerCase().trim();
  if (!s) return null;
  const words: Record<string, number> = { one: 1, two: 2, three: 3 };
  const numMatch = s.match(/(\d+(?:\.\d+)?)|\b(one|two|three)\b/);
  if (!numMatch) return null;
  let n = numMatch[1] ? Number(numMatch[1]) : words[numMatch[2]];
  if (/half|1\/2/.test(s)) n += 0.5;
  if (/\bmins?\b|minutes?/.test(s)) return Math.round((n / 60) * 100) / 100;
  if (/\bdays?\b/.test(s)) return n * 8;
  if (/\bhours?\b|\bhrs?\b|half/.test(s) || /^\d+(\.\d+)?$/.test(s)) return n;
  return null;
}

export function mapTaskStatus(s: string): "done" | "in_progress" | "todo" {
  return s === "Completed" ? "done" : s === "In Progress" ? "in_progress" : "todo";
}

/** Overall project status from each person's status: anyone ongoing → active; else on hold; else upcoming; else completed. */
export function rollupStatus(statuses: (ProjectStatus | null)[]): ProjectStatus {
  const s = statuses.filter(Boolean) as ProjectStatus[];
  if (s.length === 0 || s.includes("active")) return "active";
  if (s.includes("on_hold")) return "on_hold";
  if (s.includes("planning")) return "planning";
  return "completed";
}

export function rollupPriority(ps: (Priority | null)[]): Priority {
  const order: Priority[] = ["urgent", "high", "medium", "low"];
  return order.find((o) => ps.includes(o)) ?? "medium";
}

/** "Node & PHP" → ["node","php"], "Web Designer" → ["web design"]. */
export function techToSkills(t: string): string[] {
  return t.split(/&|,/).map((x) => x.trim().toLowerCase().replace(/^web designer$/, "web design").replace(/^tester$/, "testing")).filter(Boolean);
}

export function techToRole(t: string): "frontend" | "backend" | "fullstack" | "qa" | "design" | "other" {
  const s = t.toLowerCase();
  if (s.includes("tester")) return "qa";
  if (s.includes("design")) return "design";
  if (s.includes("flutter") && (s.includes("node") || s.includes("php"))) return "fullstack";
  if (s.includes("node") || s.includes("php")) return "backend";
  if (s.includes("flutter") || s.includes("front")) return "frontend";
  return "other";
}
