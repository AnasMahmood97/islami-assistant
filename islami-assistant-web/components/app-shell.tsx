"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AssistantAvatarPanel } from "@/components/layout/assistant-avatar-panel";
import { TopHeader } from "@/components/layout/top-header";

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf6] to-[#ffeedd]">
      <TopHeader />
      <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 gap-3 p-3 lg:grid-cols-12 lg:gap-4 lg:p-4">
        <SidebarNav userName={userName} />
        <main className="glass-card order-2 bg-white/70 p-4 lg:order-none lg:col-span-8 lg:p-6">{children}</main>
        <AssistantAvatarPanel />
      </div>
    </div>
  );
}
