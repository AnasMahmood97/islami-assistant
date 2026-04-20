"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopHeader } from "@/components/layout/top-header";

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f3f5f8]">
      <TopHeader />
      <div className="grid min-h-[calc(100vh-72px)] grid-cols-12">
        <SidebarNav userName={userName} />
        <main className="col-span-9 bg-[#faf8f5] p-6">{children}</main>
      </div>
    </div>
  );
}
