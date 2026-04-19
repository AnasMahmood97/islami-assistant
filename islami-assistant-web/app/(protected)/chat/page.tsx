"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Message = { role: "user" | "assistant"; text: string; imageUrl?: string | null; matched?: boolean };

const STORAGE_DAY = "islami-chat-day";

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const prev = sessionStorage.getItem(STORAGE_DAY);
    if (prev && prev !== today) {
      setMessages([]);
      setPendingQuestion("");
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
    <section className="rounded-2xl bg-white p-4 shadow-sm">
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
        يمكنك السؤال عن ما ورد في ملف الأسئلة المعتمد. تُحدَّث المحادثة تلقائيًا عند بداية يوم جديد.
      </p>
      <div className="mb-3 h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-[#f8fafc] p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">ابدأ بسؤال متعلق بخدمات البنك.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`mb-3 ${m.role === "user" ? "text-right" : "text-left"}`}>
              <div
                className={`inline-block max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-[#9e1b1f] text-white" : "border border-slate-200 bg-white"
                }`}
              >
                {m.text}
              </div>
              {m.imageUrl ? (
                <img src={m.imageUrl} className="mt-2 max-h-52 rounded-lg border object-contain" alt="" />
              ) : null}
            </div>
          ))
        )}
      </div>
      {pendingQuestion ? (
        <button
          type="button"
          onClick={sendToAdmin}
          className="mb-3 rounded-lg bg-[#ef7d00] px-3 py-2 text-sm text-white"
        >
          إرسال السؤال للمسؤول
        </button>
      ) : null}
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
