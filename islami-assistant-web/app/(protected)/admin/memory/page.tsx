"use client";

import { useEffect, useState } from "react";

type Unknown = { id: string; text: string; createdAt: string; user: { name: string } };
type Knowledge = { id: string; question: string; answer: string; keywords?: string | null };

export default function AdminMemoryPage() {
  const [rows, setRows] = useState<Unknown[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [knowledgeRows, setKnowledgeRows] = useState<Knowledge[]>([]);

  const load = async () => {
    const [unknownRes, knowledgeRes] = await Promise.all([
      fetch("/api/unknown-questions"),
      fetch("/api/admin/knowledge"),
    ]);
    setRows(await unknownRes.json());
    setKnowledgeRows(await knowledgeRes.json());
  };

  useEffect(() => {
    void (async () => {
      const [unknownRes, knowledgeRes] = await Promise.all([
        fetch("/api/unknown-questions"),
        fetch("/api/admin/knowledge"),
      ]);
      setRows(await unknownRes.json());
      setKnowledgeRows(await knowledgeRes.json());
    })();
  }, []);

  const addKnowledge = async () => {
    const res = await fetch("/api/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, keywords: keywords || undefined, imageUrl: imageUrl || undefined }),
    });
    if (!res.ok) {
      alert("تعذر الحفظ");
      return;
    }
    setQuestion("");
    setAnswer("");
    setKeywords("");
    setImageUrl("");
    alert("تمت الإضافة إلى ذاكرة الذكاء الاصطناعي.");
  };

  const resolveUnknown = async (u: Unknown) => {
    if (!u.text.trim()) return;
    const res = await fetch("/api/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: u.text, answer, keywords: keywords || undefined }),
    });
    const item = await res.json();
    await fetch(`/api/unknown-questions/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED", resolvedKnowledgeItemId: item.id }),
    });
    setAnswer("");
    load();
    alert("تم حفظ الإجابة وإغلاق الطلب.");
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[#9e1b1f]">ذاكرة الذكاء الاصطناعي</h2>

      <div className="mb-8 grid gap-4 border-b border-slate-200 pb-8 lg:grid-cols-3">
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const file = fd.get("file");
            if (!(file instanceof File) || file.size === 0) return;
            const res = await fetch("/api/admin/import/knowledge", { method: "POST", body: fd });
            const data = await res.json();
            alert(`تم استيراد ${data.imported ?? 0} سطرًا.`);
          }}
        >
          <h3 className="font-semibold">رفع Excel للأسئلة</h3>
          <input type="file" name="file" accept=".xlsx,.xls" className="text-sm" />
          <button type="submit" className="rounded-lg bg-[#9e1b1f] px-3 py-2 text-sm text-white">
            استيراد
          </button>
        </form>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const file = fd.get("file");
            if (!(file instanceof File) || file.size === 0) return;
            const res = await fetch("/api/admin/import/finance-rates", { method: "POST", body: fd });
            const data = await res.json();
            alert(`تم استيراد ${data.imported ?? 0} صفًا من النسب.`);
          }}
        >
          <h3 className="font-semibold">رفع «نسب التمويلات»</h3>
          <input type="file" name="file" accept=".xlsx,.xls" className="text-sm" />
          <button type="submit" className="rounded-lg bg-[#ef7d00] px-3 py-2 text-sm text-white">
            استيراد النسب
          </button>
        </form>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const file = fd.get("file");
            if (!(file instanceof File) || file.size === 0) return;
            const res = await fetch("/api/finance-companies", { method: "POST", body: fd });
            const data = await res.json();
            alert(`تم استيراد ${data.imported ?? 0} شركة.`);
          }}
        >
          <h3 className="font-semibold">قائمة الشركات المعتمدة</h3>
          <input type="file" name="file" accept=".xlsx,.xls" className="text-sm" />
          <button type="submit" className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white">
            استيراد الشركات
          </button>
        </form>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} className="input" placeholder="السؤال" />
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="input" placeholder="كلمات مفتاحية (اختياري، مفصولة بفواصل)" />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="input min-h-[100px] md:col-span-2"
          placeholder="الجواب"
        />
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-slate-600">صورة (اختياري)</label>
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/uploads", { method: "POST", body: fd });
              if (!res.ok) {
                alert("فشل رفع الصورة");
                return;
              }
              const data = await res.json();
              setImageUrl(data.url);
            }}
          />
          {imageUrl ? <p className="mt-1 text-xs text-slate-500">{imageUrl}</p> : null}
        </div>
        <button type="button" onClick={addKnowledge} className="rounded-lg bg-[#9e1b1f] py-2 text-white md:col-span-2">
          إضافة مباشرة للذاكرة
        </button>
      </div>

      <h3 className="mb-2 font-semibold">أسئلة وردت ولم تُجاب بعد</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-semibold">{row.text}</p>
            <p className="text-slate-500">
              بواسطة: {row.user?.name ?? "-"} — {new Date(row.createdAt).toLocaleString("ar-JO")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded bg-slate-100 px-2 py-1"
                onClick={() => setQuestion(row.text)}
              >
                نقل السؤال للحقول أعلاه
              </button>
              <button type="button" className="rounded-lg bg-[#ef7d00] px-3 py-1 text-white" onClick={() => resolveUnknown(row)}>
                حفظ إجابة وإغلاق الطلب
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              اكتب الإجابة في الحقل العام ثم اضغط «حفظ إجابة وإغلاق الطلب» لنفس السؤال.
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8 border-t border-slate-200 pt-4">
        <h3 className="mb-2 font-semibold">الأسئلة المتعلّمة (إدارة)</h3>
        <div className="space-y-2">
          {knowledgeRows.slice(0, 100).map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold">{item.question}</p>
              <p className="mt-1 text-slate-600">{item.answer}</p>
              <p className="mt-1 text-xs text-slate-500">الكلمات المفتاحية: {item.keywords || "-"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded bg-slate-100 px-2 py-1"
                  onClick={() => {
                    setQuestion(item.question);
                    setAnswer(item.answer);
                    setKeywords(item.keywords ?? "");
                  }}
                >
                  تعديل عبر النموذج
                </button>
                <button
                  type="button"
                  className="text-red-600"
                  onClick={async () => {
                    await fetch(`/api/admin/knowledge/${item.id}`, { method: "DELETE" });
                    load();
                  }}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
