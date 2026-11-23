import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "PM Command Center";
  return (
    <div className="flex min-h-screen">
      <Sidebar appName={appName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar appName={appName} />
        <main className="flex-1 p-3 md:p-5">{children}</main>
      </div>
    </div>
  );
}
