import { CommandPalette } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { NewMenu } from "./NewMenu";

export function TopBar({ appName }: { appName: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-5">
      <MobileNav appName={appName} />
      <span className="text-sm font-semibold md:hidden">{appName}</span>
      <div className="ml-auto flex items-center gap-2">
        <CommandPalette />
        <NewMenu />
      </div>
    </header>
  );
}
