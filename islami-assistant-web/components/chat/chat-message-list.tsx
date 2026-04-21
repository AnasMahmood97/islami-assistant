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
    <div className="mb-3 h-[60vh] overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-3">
      {messages.length === 0 ? (
        <p className="text-sm text-slate-500">ابدأ بسؤال متعلق بخدمات البنك.</p>
      ) : (
        messages.map((m, i) => (
          <div key={i} className={`mb-3 flex items-start gap-2 ${m.role === "user" ? "justify-start" : "justify-end"}`}>
            {m.role === "user" ? <UserAvatar avatarUrl={avatarUrl} userName={userName} /> : null}
            <div
              className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-sm ${
                m.role === "user"
                  ? "bg-[#FFDDB8] text-[#6f3300] text-right"
                  : "border border-slate-200 bg-white text-right"
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
