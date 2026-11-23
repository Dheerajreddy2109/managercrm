"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard, type BoardTask } from "./KanbanBoard";
import { MilestonesPanel } from "./MilestonesPanel";
import { NotesPanel } from "./NotesPanel";
import { ProjectSettings } from "./ProjectSettings";
import { ProjectTeamPanel } from "./ProjectTeamPanel";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskSheet } from "@/components/tasks/TaskSheet";
import type { getProject } from "@/lib/services/projects";

type Project = Awaited<ReturnType<typeof getProject>>;

export function ProjectTabs({ project, tasks }: { project: Project; tasks: BoardTask[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = params.get("tab") ?? "board";
  const setTab = (t: string) => { const n = new URLSearchParams(params.toString()); if (t === "board") n.delete("tab"); else n.set("tab", t); router.replace(n.size ? `${pathname}?${n}` : pathname); };
  const openTask = useCallback((id: string) => { const n = new URLSearchParams(params.toString()); n.set("task", id); router.replace(`${pathname}?${n}`); }, [params, pathname, router]);
  const risks = project.notes.filter((n) => n.type === "risk").length;

  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List <span className="ml-1 text-muted-foreground">{tasks.length}</span></TabsTrigger>
          <TabsTrigger value="milestones">Milestones <span className="ml-1 text-muted-foreground">{project.milestones.length}</span></TabsTrigger>
          <TabsTrigger value="team">Team <span className="ml-1 text-muted-foreground">{project.members.length}</span></TabsTrigger>
          <TabsTrigger value="notes">Notes &amp; risks {risks > 0 && <span className="ml-1 text-red-600">{risks}</span>}</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-3"><KanbanBoard tasks={tasks} projectId={project.id} projectName={project.name} milestones={project.milestones} onOpenTask={openTask} /></TabsContent>
        <TabsContent value="list" className="mt-3"><TaskTable tasks={tasks} onOpen={openTask} /></TabsContent>
        <TabsContent value="milestones" className="mt-3"><MilestonesPanel projectId={project.id} milestones={project.milestones} /></TabsContent>
        <TabsContent value="team" className="mt-3"><ProjectTeamPanel projectId={project.id} members={project.members} /></TabsContent>
        <TabsContent value="notes" className="mt-3"><NotesPanel projectId={project.id} notes={project.notes} /></TabsContent>
        <TabsContent value="settings" className="mt-3"><ProjectSettings project={project} openTaskCount={project.progress.totalTasks - project.progress.doneTasks} /></TabsContent>
      </Tabs>
      <TaskSheet />
    </>
  );
}
