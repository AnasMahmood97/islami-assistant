"use client";

import { getAvatarEmoji } from "@/lib/avatar";

export function AssistantAvatar() {
  return (
    <img
      src="/data/islamibot.jpeg"
      alt="Islami Bot"
      className="h-9 w-9 rounded-full border border-slate-200 object-cover"
    />
  );
}

export function UserAvatar({ avatarUrl, userName }: { avatarUrl: string | null; userName?: string | null }) {
  const emoji = getAvatarEmoji(avatarUrl);

  if (emoji) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg">
        {emoji}
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9e1b1f] text-xs font-bold text-white">
      {(userName ?? "U").slice(0, 2).toUpperCase()}
    </div>
  );
}
