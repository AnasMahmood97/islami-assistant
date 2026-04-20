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
      <ChatMessageList messages={messages} avatarUrl={avatarUrl} userName={session?.user?.name} />
      <button
        type="button"
        onClick={sendToAdmin}
        disabled={!pendingQuestion}
        className={`mb-3 rounded-lg px-3 py-2 text-sm text-white ${pendingQuestion ? "bg-[#ef7d00]" : "cursor-not-allowed bg-slate-300"}`}
      >
        اقتراح سؤال للمسؤول
      </button>
      <ChatComposer text={text} loading={loading} onTextChange={setText} onSend={send} />
    </section>
  );
}
