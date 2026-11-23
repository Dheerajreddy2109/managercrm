import { CalendarCheck, FolderKanban, LayoutDashboard, ListTodo, type LucideIcon, Users, BarChart3 } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/team", label: "Team", icon: Users },
  { href: "/daily-updates", label: "Daily updates", icon: CalendarCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];
