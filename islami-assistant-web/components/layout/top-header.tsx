"use client";

import { IntroVideoButton } from "@/components/ui/intro-video-button";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export function TopHeader() {
  return (
    <header className="flex items-center justify-between border-b border-[#E60000]/20 bg-white/95 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-2">
        <IntroVideoButton />
        <Link href="/settings" className="rounded-lg border border-[#E60000]/25 bg-white p-2 text-[#E60000] shadow-sm">
          <Settings className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg border border-[#E60000]/25 bg-white p-2 text-[#E60000] shadow-sm"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      <img
        src="/data/The%20head%20of%20the%20page.jpg"
        alt="Islami Assistant"
        className="h-14 w-auto rounded-lg border border-[#E60000]/10 bg-white object-contain shadow-sm"
      />
    </header>
  );
}
