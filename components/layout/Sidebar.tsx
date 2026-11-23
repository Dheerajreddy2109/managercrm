import { LogoutButton } from "@/components/auth/LogoutButton";
import { SidebarNav } from "./SidebarNav";

export function Sidebar({ appName }: { appName: string }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r bg-muted/20 md:flex">
      <div className="flex h-12 items-center gap-2 border-b px-4">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">PM</span>
        <span className="truncate text-sm font-semibold">{appName}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <SidebarNav />
      </div>
      <div className="border-t p-2">
        <LogoutButton />
      </div>
    </aside>
  );
}
