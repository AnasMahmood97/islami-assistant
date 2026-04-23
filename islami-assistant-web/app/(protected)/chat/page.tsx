"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatComposer } from "@/components/chat/chat-composer";

type Message = { role: "user" | "assistant"; text: string; imageUrl?: string | null; matched?: boolean };

const STORAGE_DAY = "islami-chat-day";

export default function ChatPage() {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshAvatar = async () => {
    try {
      const res = await fetch("/api/me");
      const me = await res.json();
      setAvatarUrl(me.avatarUrl ?? null);
    } catch {
      setAvatarUrl(null);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const prev = sessionStorage.getItem(STORAGE_DAY);
    if (prev && prev !== today) {
      window.setTimeout(() => {
        setMessages([]);
        setPendingQuestion("");
      }, 0);
    }
    sessionStorage.setItem(STORAGE_DAY, today);

    const id = window.setInterval(() => {
      const d = new Date().toISOString().slice(0, 10);
      if (d !== sessionStorage.getItem(STORAGE_DAY)) {
        sessionStorage.setItem(STORAGE_DAY, d);
        setMessages([]);
        setPendingQuestion("");
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    refreshAvatar();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "profile-avatar-updated-at") refreshAvatar();
    };
    const onProfileAvatarUpdated = () => refreshAvatar();
    window.addEventListener("storage", onStorage);
    window.addEventListener("profile-avatar-updated", onProfileAvatarUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("profile-avatar-updated", onProfileAvatarUpdated);
    };
  }, []);

  const send = async () => {
    if (!text.trim() || loading) return;
    const q = text.trim();
    setText("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", text: q }]);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    const data = await res.json();
    const assistant: Message = {
      role: "assistant",
      text: data.answer ?? "حدث خطأ",
      imageUrl: data.imageUrl,
      matched: data.matched,
    };
    setMessages((m) => [...m, assistant]);
    if (!assistant.matched) setPendingQuestion(q);
    else setPendingQuestion("");
    setLoading(false);
  };

  const sendToAdmin = async () => {
    if (!pendingQuestion) return;
    await fetch("/api/unknown-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pendingQuestion }),
    });
    setPendingQuestion("");
    alert("تم إرسال السؤال للمسؤول.");
  };

  const newChat = () => {
    setMessages([]);
    setPendingQuestion("");
    sessionStorage.setItem(STORAGE_DAY, new Date().toISOString().slice(0, 10));
  };

  return (
    <section className="flex h-[calc(100vh-190px)] flex-col bg-white px-2 pb-2">
      <div className="mb-2 flex items-center justify-end">
        <button type="button" onClick={newChat} className="rounded-xl bg-[#E60000]/10 px-3 py-1 text-sm hover:bg-[#E60000]/20">
          محادثة جديدة
        </button>
      </div>
      <h2 className="mb-3 text-center text-2xl font-bold text-[#E60000]">كيف يمكنني مساعدتك اليوم؟</h2>
      <p className="mb-3 text-center text-sm text-slate-500">
        {session?.user?.name ? `مرحبًا ${session.user.name}، ` : ""}
        تُحدَّث المحادثة تلقائيًا عند بداية يوم جديد.
      </p>
      <div className="min-h-0 flex-1">
        <ChatMessageList messages={messages} avatarUrl={avatarUrl} userName={session?.user?.name} />
      </div>
      <div className="mt-2 space-y-2 border-t border-[#f1f1f1] bg-white pt-3">
        <button
          type="button"
          onClick={sendToAdmin}
          disabled={!pendingQuestion}
          className={`rounded-xl px-3 py-1.5 text-xs text-white ${pendingQuestion ? "bg-[#E60000]" : "cursor-not-allowed bg-slate-300"}`}
        >
          اقتراح سؤال للمسؤول
        </button>
        <ChatComposer text={text} loading={loading} onTextChange={setText} onSend={send} />
      </div>
    </section>
  );
}
