"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { SidebarNav } from "./SidebarNav";

export function MobileNav({ appName }: { appName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}>
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-sm">{appName}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 p-2">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t p-2">
          <LogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
