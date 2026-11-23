import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProjectPerson = {
  id: string; name: string; avatarColor: string | null; role: string; skills: string[];
  projectRole: string | null; workingOn: { title: string; status: string }[];
};

/** Assigned people with their tech stack and what they're working on (no links: rendered inside card links). */
export function ProjectPeople({ people, techStack, max = 2 }: { people: ProjectPerson[]; techStack?: string[]; max?: number }) {
  return (
    <div className="mt-3 space-y-2 border-t pt-2">
      {techStack && techStack.length > 0 && (
        <div className="text-[11px] text-muted-foreground">Project stack: <span className="text-foreground">{techStack.join(", ")}</span></div>
      )}
      {people.length === 0 && <div className="text-[11px] text-muted-foreground">No one assigned</div>}
      {people.map((m) => (
        <div key={m.id} className="flex gap-2">
          <MemberAvatar name={m.name} color={m.avatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
              <span className="font-medium">{m.name}</span>
              <span className="text-muted-foreground">{m.projectRole || titleCase(m.role)}</span>
            </div>
            {m.skills.length > 0 && (
              <div className="mt-0.5 flex flex-wrap gap-1">
                {m.skills.map((s) => <span key={s} className="rounded bg-muted px-1.5 py-px text-[10px]">{s}</span>)}
              </div>
            )}
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {m.workingOn.length === 0 ? "Not working on any task here" : (
                <>Working on:{" "}
                  {m.workingOn.slice(0, max).map((t, i) => (
                    <span key={i} className={cn("text-foreground", t.status === "blocked" && "text-amber-600")}>{i > 0 && ", "}{t.title}{t.status === "blocked" && " (blocked)"}</span>
                  ))}
                  {m.workingOn.length > max && ` +${m.workingOn.length - max} more`}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
