"use client";

import { AssistantAvatar, UserAvatar } from "./chat-avatars";

type Message = { role: "user" | "assistant"; text: string; imageUrl?: string | null };
const IMAGE_PATH_REGEX = /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i;

function shouldRenderImage(url?: string | null) {
  if (!url) return false;
  return IMAGE_PATH_REGEX.test(url);
}

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
            className={`mb-4 flex items-start gap-3 ${
              m.role === "user" ? "flex-row justify-start" : "flex-row-reverse justify-start"
            }`}
            style={{ direction: "ltr" }}
          >
            {m.role === "user" ? <UserAvatar avatarUrl={avatarUrl} userName={userName} /> : <AssistantAvatar />}
            <div className="max-w-[80%]">
              <p className="mb-1 text-xs text-slate-500" style={{ direction: "rtl", textAlign: "right" }}>
                {m.role === "user" ? (userName || "أنت") : "المساعد"}
              </p>
              <div
                className={`inline-block rounded-2xl px-4 py-2 text-sm leading-7 whitespace-pre-wrap shadow-sm ${
                  m.role === "user"
                    ? "bg-[#FFEEEE] text-[#333333] rounded-tl-none"
                    : "bg-white border border-[#E0E0E0] text-[#333333] rounded-tr-none"
                }`}
                style={{ direction: "rtl", textAlign: "right" }}
              >
                {m.text}
                {shouldRenderImage(m.imageUrl) ? (
                  <img src={m.imageUrl ?? ""} className="mt-2 max-h-52 rounded-lg border object-contain" alt="attachment" />
                ) : null}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
