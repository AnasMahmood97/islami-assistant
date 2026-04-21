"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type Template = {
  id: string;
  title: string;
  subject?: string | null;
  body: string;
  notes?: string | null;
  scope: string;
};

export default function CorrespondencePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Template[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", subject: "", body: "", notes: "", scope: "PRIVATE" });

  const load = async () => {
    const res = await fetch("/api/mail-templates");
    setRows(await res.json());
  };

  useEffect(() => {
    void fetch("/api/mail-templates")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((r) =>
      [r.title, r.subject, r.body, r.notes].some((v) => String(v ?? "").toLowerCase().includes(n))
    );
  }, [rows, q]);

  return (
    <section dir="rtl" className="chat-pane text-right">
      <h2 className="mb-5 text-2xl font-bold text-[#b65600]">المراسلات</h2>
      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="بحث في القوالب" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mb-6 grid gap-3 rounded-2xl border border-orange-200 p-3 text-sm md:grid-cols-2 md:p-4">
        <input className="input" placeholder="العنوان" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
        <input className="input" placeholder="الموضوع" value={form.subject} onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))} />
        <textarea className="input min-h-24 md:col-span-2" placeholder="النص" value={form.body} onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))} />
        <textarea className="input min-h-20 md:col-span-2" placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
        <select className="input" value={form.scope} onChange={(e) => setForm((s) => ({ ...s, scope: e.target.value }))}>
          <option value="PRIVATE">خاص بي</option>
          {isAdmin ? <option value="SHARED">مشترك للموظفين</option> : null}
        </select>
        <button
          type="button"
          className="rounded-xl bg-[#FF7F00] px-3 py-2 text-white"
          onClick={async () => {
            const endpoint = editingId ? `/api/mail-templates/${editingId}` : "/api/mail-templates";
            const res = await fetch(endpoint, {
              method: editingId ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            if (!res.ok) {
              alert("فشل الحفظ");
              return;
            }
            setEditingId(null);
            setForm({ title: "", subject: "", body: "", notes: "", scope: "PRIVATE" });
            load();
          }}
        >
          {editingId ? "حفظ التعديلات" : "حفظ قالب"}
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((row) => (
          <article key={row.id} className="group rounded-2xl border border-orange-100 bg-white/90 p-3 transition-all duration-300 ease-out hover:shadow-[0_10px_24px_rgba(255,127,0,0.14)]">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="font-semibold">{row.title}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs ${row.scope === "SHARED" ? "bg-[#ef7d00]/20 text-[#9e1b1f]" : "bg-slate-100 text-slate-700"}`}>
                {row.scope === "SHARED" ? "مشترك" : "خاص"}
              </span>
            </div>
            <p className="text-sm text-slate-600">{row.subject || "-"}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{row.body}</p>
            {row.notes ? <p className="mt-2 text-xs text-slate-500">ملاحظات: {row.notes}</p> : null}
            <div className="mt-2 flex gap-2">
              <button type="button" className="rounded bg-slate-100 px-2 py-1 text-sm" onClick={() => navigator.clipboard.writeText(row.body)}>
                نسخ النص
              </button>
              {isAdmin ? (
                <button
                  type="button"
                  className="text-sm text-[#b65600] admin-hover-action"
                  onClick={() => {
                    setEditingId(row.id);
                    setForm({
                      title: row.title,
                      subject: row.subject ?? "",
                      body: row.body,
                      notes: row.notes ?? "",
                      scope: row.scope === "SHARED" ? "SHARED" : "PRIVATE",
                    });
                  }}
                >
                  تعديل
                </button>
              ) : null}
              <button
                type="button"
                className="text-sm text-red-600 admin-hover-action"
                onClick={async () => {
                  await fetch(`/api/mail-templates/${row.id}`, { method: "DELETE" });
                  load();
                }}
              >
                حذف
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
