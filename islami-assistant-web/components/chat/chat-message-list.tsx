"use client";

import { useState } from "react";
import { AssistantAvatar, UserAvatar } from "./chat-avatars";
import { getPublicUrl } from "@/lib/public-url";

type Message = { role: "user" | "assistant"; text: string; imageUrl?: string | null };
const IMAGE_PATH_REGEX = /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i;

function shouldRenderImage(url?: string | null) {
  const normalized = getPublicUrl(url);
  if (!normalized) return false;
  return (
    IMAGE_PATH_REGEX.test(normalized) ||
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  );
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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});

  return (
    <>
      <div className="h-full overflow-y-auto bg-white px-2">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">ابدأ بسؤال متعلق بخدمات البنك.</p>
        ) : (
          messages.map((m, i) => {
            const imageUrl = getPublicUrl(m.imageUrl);
            const canShowAssistantImage =
              m.role === "assistant" &&
              Boolean(imageUrl) &&
              shouldRenderImage(imageUrl) &&
              !failedImages[imageUrl ?? ""];
            return (
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
                  {canShowAssistantImage ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <img
                        src={imageUrl ?? ""}
                        className="max-h-52 cursor-zoom-in rounded-lg object-contain"
                        alt="assistant answer image"
                        onClick={() => setZoomedImage(imageUrl ?? null)}
                        onError={() => setFailedImages((prev) => ({ ...prev, [imageUrl ?? ""]: true }))}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
      {zoomedImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setZoomedImage(null)}>
          <img
            src={zoomedImage}
            alt="Zoomed attachment"
            className="max-h-[90vh] max-w-[90vw] rounded-xl border border-white/20 bg-white object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
