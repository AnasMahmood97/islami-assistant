"use client";

import { AssistantAvatar, UserAvatar } from "./chat-avatars";

type Message = { role: "user" | "assistant"; text: string; imageUrl?: string | null };

export function ChatMessageList({
  messages,
  avatarUrl,
  userName,
}: {
  messages: Message[];
  avatarUrl: string | null;
  userName?: string | null;
}) {
  return (
    <div className="h-full overflow-y-auto bg-white px-2">
      {messages.length === 0 ? (
        <p className="text-center text-sm text-slate-500">ابدأ بسؤال متعلق بخدمات البنك.</p>
      ) : (
        messages.map((m, i) => (
          <div
            key={i}
            className={`mb-4 flex items-start gap-2 ${
              m.role === "user" ? "flex-row-reverse justify-end" : "flex-row justify-end"
            }`}
          >
            {m.role === "user" ? <UserAvatar avatarUrl={avatarUrl} userName={userName} /> : null}
            <div
              className={`inline-block max-w-[82%] rounded-2xl px-4 py-2 text-sm leading-7 whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[#FFEEEE] text-[#333333] text-right rounded-2xl rounded-tl-none"
                  : "bg-white border border-[#E0E0E0] text-[#333333] text-right rounded-2xl rounded-tr-none"
              }`}
            >
              {m.text}
              {m.imageUrl ? <img src={m.imageUrl} className="mt-2 max-h-52 rounded-lg border object-contain" alt="" /> : null}
            </div>
            {m.role === "assistant" ? <AssistantAvatar /> : null}
          </div>
        ))
      )}
    </div>
  );
}
