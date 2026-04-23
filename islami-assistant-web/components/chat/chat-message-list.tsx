"use client";

import { useState } from "react";
import { AssistantAvatar, UserAvatar } from "./chat-avatars";
import { sanitizeKnowledgeImageUrl } from "@/lib/knowledge-image-url";

type Message = { role: "user" | "assistant"; text: string; imageUrl?: string | null };

function getRenderableImageSrc(pathValue?: string | null) {
  return sanitizeKnowledgeImageUrl(pathValue);
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
            if (m.imageUrl === "Knowledge preview") return null;
            const imageUrl = m.role === "assistant" ? getRenderableImageSrc(m.imageUrl) : null;
            const canShowAssistantImage =
              m.role === "assistant" &&
              Boolean(imageUrl) &&
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
                    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                      <img
                        src={imageUrl ?? ""}
                        alt="Visual Response"
                        loading="lazy"
                        className="h-auto w-full cursor-zoom-in object-contain shadow-sm"
                        onClick={() => setZoomedImage(imageUrl ?? null)}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          setFailedImages((prev) => ({ ...prev, [imageUrl ?? ""]: true }));
                        }}
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
            alt="صورة الإجابة مكبرة"
            className="max-h-[90vh] max-w-[90vw] rounded-xl border border-white/20 bg-white object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
