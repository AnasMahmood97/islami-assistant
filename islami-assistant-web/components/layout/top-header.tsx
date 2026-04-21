"use client";

import { IntroVideoButton } from "@/components/ui/intro-video-button";

export function TopHeader() {
  return (
    <header className="flex items-center justify-between border-b border-orange-200 bg-white/90 px-4 py-2 backdrop-blur">
      <IntroVideoButton />
      <img
        src="/data/The%20head%20of%20the%20page.jpg"
        alt="Islami Assistant"
        className="h-14 w-auto rounded-lg object-contain"
      />
    </header>
  );
}
