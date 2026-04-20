"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Message = { role: "user" | "assistant"; text: string; imageUrl?: string | null; matched?: boolean };

const STORAGE_DAY = "islami-chat-day";

export default function ChatPage() {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const assistantCandidates = [
    "/avatars/1.jpg",
    "/avatars/2.jpg",
    "/avatars/3.jpg",
    "/avatars/4.jpg",
    "/avatars/5.jpg",
    "/avatars/6.jpg",
    "/avatars/7.jpg",
    "/avatars/8.jpg",
    "/avatars/9.jpg",
    "/avatars/10.jpg",
    "/data/1.jpg",
    "/data/2.jpg",
    "/data/3.jpg",
    "/data/4.jpg",
    "/data/5.jpg",
    "/data/6.jpg",
    "/data/7.jpg",
    "/data/8.jpg",
    "/data/9.jpeg",
    "/data/10.jpeg",
  ];
  const [assistantAvatar] = useState(() => {
    const idx = Math.floor(Math.random() * assistantCandidates.length);
    return assistantCandidates[idx];
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [loading, setLoading] = useState(false);

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
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => setAvatarUrl(me.avatarUrl ?? null))
      .catch(() => setAvatarUrl(null));
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
    <section className="chat-pane shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#9e1b1f]">محادثة الذكاء الاصطناعي</h2>
        <button
          type="button"
          onClick={newChat}
          className="rounded-lg bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200"
        >
          محادثة جديدة
        </button>
      </div>
      <p className="mb-2 text-sm text-slate-500">
        {session?.user?.name ? `مرحبًا ${session.user.name}، ` : ""}
        تُحدَّث المحادثة تلقائيًا عند بداية يوم جديد.
      </p>
      <div className="mb-3 h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-transparent p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">ابدأ بسؤال متعلق بخدمات البنك.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`mb-3 flex items-start gap-2 ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              {m.role === "assistant" ? (
                <img
                  src={assistantAvatar}
                  alt="Islami Bot"
                  className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/data/islamibot.jpeg";
                  }}
                />
              ) : null}
              <div
                className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-sm ${
                  m.role === "user" ? "bg-[#9e1b1f] text-white text-right" : "border border-slate-200 bg-white text-right"
                }`}
              >
                {m.text}
                {m.imageUrl ? (
                  <img src={m.imageUrl} className="mt-2 max-h-52 rounded-lg border object-contain" alt="" />
                ) : null}
              </div>
              {m.role === "user" ? (
                avatarUrl ? (
                  <img src={avatarUrl} alt="User avatar" className="h-9 w-9 rounded-full border border-slate-200 object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ef7d00] text-xs font-bold text-white">
                    {(session?.user?.name ?? "U").slice(0, 2).toUpperCase()}
                  </div>
                )
              ) : null}
            </div>
          ))
        )}
      </div>
      <button
        type="button"
        onClick={sendToAdmin}
        disabled={!pendingQuestion}
        className={`mb-3 rounded-lg px-3 py-2 text-sm text-white ${pendingQuestion ? "bg-[#ef7d00]" : "cursor-not-allowed bg-slate-300"}`}
      >
        اقتراح سؤال للمسؤول
      </button>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
          placeholder="اكتب سؤالك..."
        />
        <button type="button" onClick={send} disabled={loading} className="rounded-lg bg-[#9e1b1f] px-4 py-2 text-white">
          {loading ? "..." : "إرسال"}
        </button>
      </div>
    </section>
  );
}
