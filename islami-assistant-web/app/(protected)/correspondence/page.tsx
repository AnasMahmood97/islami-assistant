"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Mail, Pencil, Trash2, X } from "lucide-react";

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
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
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
      <h2 className="mb-5 text-2xl font-bold text-[#E60000]">المراسلات</h2>
      <div className="mb-6 grid gap-3 rounded-2xl border border-[#E60000]/20 p-3 text-sm md:grid-cols-2 md:p-4">
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
          className="rounded-xl bg-[#E60000] px-3 py-2 text-white"
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
        {isAdmin ? (
          <button
            type="button"
            className="rounded-xl bg-red-700 px-3 py-2 text-white"
            onClick={async () => {
              if (!confirm("هل أنت متأكد من مسح كافة المراسلات؟")) return;
              const res = await fetch("/api/mail-templates", { method: "DELETE" });
              if (!res.ok) return alert("تعذر المسح");
              load();
            }}
          >
            مسح كافة المراسلات
          </button>
        ) : null}
      </div>
      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="بحث في العنوان والنص" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((row) => (
          <article key={row.id} className="flex min-h-[250px] flex-col rounded-2xl border border-[#E60000]/15 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-[0_10px_24px_rgba(230,0,0,0.14)]">
            <div className="mb-2 flex justify-center">
              <Mail className="h-7 w-7 text-slate-400" />
            </div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="flex-1 text-center font-semibold">{row.title}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs ${row.scope === "SHARED" ? "bg-[#E60000]/15 text-[#E60000]" : "bg-slate-100 text-slate-700"}`}>
                {row.scope === "SHARED" ? "مشترك" : "خاص"}
              </span>
            </div>
            <p className="mb-3 line-clamp-3 text-center text-sm text-slate-600">{row.subject || row.body}</p>
            <button
              className="mt-auto rounded-xl bg-[#9e1b1f] px-3 py-2 text-sm text-white"
              onClick={() => setSelectedTemplate(row)}
            >
              المزيد
            </button>
            <div className="mt-2 flex justify-center gap-2">
              {isAdmin ? (
                <button
                  type="button"
                  className="rounded p-1 text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    setEditingId(row.id);
                    setForm({
                      title: row.title,
                      subject: row.subject ?? "",
                      body: row.body,
                      notes: row.notes ?? "",
                      scope: row.scope === "SHARED" ? "SHARED" : "PRIVATE",
                    });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  title="تعديل"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              ) : null}
              {(isAdmin || row.scope === "PRIVATE") ? (
                <button
                  type="button"
                  className="rounded p-1 text-red-600 hover:bg-red-50"
                  title="حذف"
                  onClick={async () => {
                    await fetch(`/api/mail-templates/${row.id}`, { method: "DELETE" });
                    load();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {selectedTemplate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#9e1b1f]">{selectedTemplate.title}</h3>
                  {isAdmin ? (
                    <button
                      type="button"
                      className="rounded p-1 text-slate-700 hover:bg-slate-100"
                      title="تعديل العنوان/النص"
                      onClick={() => {
                        setEditingId(selectedTemplate.id);
                        setForm({
                          title: selectedTemplate.title,
                          subject: selectedTemplate.subject ?? "",
                          body: selectedTemplate.body,
                          notes: selectedTemplate.notes ?? "",
                          scope: selectedTemplate.scope === "SHARED" ? "SHARED" : "PRIVATE",
                        });
                        setSelectedTemplate(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-600">{selectedTemplate.subject || "-"}</p>
              </div>
              <button type="button" className="rounded p-1 text-slate-700 hover:bg-slate-100" onClick={() => setSelectedTemplate(null)}>
                <X className="h-4 w-4" />
            </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{selectedTemplate.body}</p>
            {selectedTemplate.notes ? <p className="mt-2 text-xs text-slate-500">ملاحظات: {selectedTemplate.notes}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
              <button type="button" className="inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-1.5 text-sm" onClick={() => navigator.clipboard.writeText(selectedTemplate.body)}>
                <Copy className="h-4 w-4" />
                نسخ النص
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded bg-[#E60000] px-3 py-1.5 text-sm text-white"
                onClick={() => {
                  const blob = new Blob([selectedTemplate.body], { type: "text/plain;charset=utf-8" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `${selectedTemplate.title}.txt`;
                  link.click();
                  URL.revokeObjectURL(link.href);
                }}
              >
                <Download className="h-4 w-4" />
                تحميل
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
          لا توجد نتائج مطابقة
        </div>
      ) : null}
    </section>
  );
}
