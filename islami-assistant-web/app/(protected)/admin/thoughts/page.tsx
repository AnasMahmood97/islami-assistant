"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Row = { routeKey: string; label: string; text: string };

export default function AssistantThoughtsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/assistant-thoughts")
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }, []);

  if (!isAdmin) {
    return <section className="chat-pane text-sm text-slate-600">هذه الصفحة متاحة للمسؤول فقط.</section>;
  }

  return (
    <section className="chat-pane">
      <h2 className="mb-4 text-xl font-bold text-[#b65600]">ماذا يفعل المساعد الآن؟</h2>
      <p className="mb-4 text-sm text-slate-600">عدّل النصوص التي تظهر في فقاعة التفكير حسب كل شاشة.</p>
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={row.routeKey} className="rounded-2xl border border-orange-200 bg-white/90 p-3">
            <p className="mb-2 text-sm font-semibold text-[#b65600]">{row.label}</p>
            <textarea
              className="input min-h-20"
              value={row.text}
              onChange={(e) =>
                setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))
              }
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={saving}
        className="mt-4 rounded-xl bg-[#FF7F00] px-4 py-2 text-white disabled:opacity-60"
        onClick={async () => {
          setSaving(true);
          const res = await fetch("/api/assistant-thoughts", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows }),
          });
          setSaving(false);
          if (!res.ok) {
            alert("تعذر الحفظ");
            return;
          }
          alert("تم حفظ النصوص بنجاح.");
        }}
      >
        حفظ العبارات
      </button>
    </section>
  );
}
