"use client";

import { useEffect, useState } from "react";
import { getAvatarEmoji, getAvatarImageUrl } from "@/lib/avatar";

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
  const imageUrl = getAvatarImageUrl(avatarUrl);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [imageUrl]);

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt="User avatar"
        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
        onError={() => setImageFailed(true)}
      />
    );
  }

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
