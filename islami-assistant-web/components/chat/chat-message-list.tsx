"use client";

import { useState } from "react";
import { AssistantAvatar, UserAvatar } from "./chat-avatars";

type Message = { role: "user" | "assistant"; text: string; imageUrl?: string | null };
const IMAGE_PATH_REGEX = /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i;
const IMAGE_ATTACHMENT_PATTERN = /\[IMAGE_ATTACHMENT:\s*([^\]]+)\]/gi;

function normalizeImagePath(url?: string | null) {
  const value = String(url ?? "").trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value;
  return `/${value}`;
}

function extractMessageImages(text: string) {
  const images: string[] = [];
  const cleanedText = text.replace(IMAGE_ATTACHMENT_PATTERN, (_, rawUrl: string) => {
    const normalized = normalizeImagePath(rawUrl);
    if (normalized) images.push(normalized);
    return "";
  }).trim();
  return { cleanedText, images };
}

function shouldRenderImage(url?: string | null) {
  const normalized = normalizeImagePath(url);
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

  return (
    <>
      <div className="h-full overflow-y-auto bg-white px-2">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">ابدأ بسؤال متعلق بخدمات البنك.</p>
        ) : (
          messages.map((m, i) => {
            const parsed = extractMessageImages(m.text);
            const fallbackImage = normalizeImagePath(m.imageUrl);
            const images = parsed.images.length ? parsed.images : fallbackImage ? [fallbackImage] : [];
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
                  {parsed.cleanedText}
                  {images
                    .filter((img) => shouldRenderImage(img))
                    .map((img) => (
                      <div key={img} className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <img
                          src={img}
                          className="max-h-52 cursor-zoom-in rounded-lg object-contain"
                          alt="attachment"
                          onClick={() => setZoomedImage(img)}
                        />
                      </div>
                    ))}
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
