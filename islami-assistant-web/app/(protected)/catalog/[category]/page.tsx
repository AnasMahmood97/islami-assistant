"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Row = {
  id: string;
  title: string;
  subcategory: string | null;
  contentJson: string;
  imageUrl?: string | null;
  pdfUrl?: string | null;
};

type Content = {
  features?: string;
  documents?: string;
  minBalance?: string;
  terms?: string;
};

export default function CatalogCategoryPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const params = useParams<{ category: string }>();
  const category = params.category;
  const [rows, setRows] = useState<Row[]>([]);
  const [newItem, setNewItem] = useState({ title: "", subcategory: "", features: "", documents: "", minBalance: "", terms: "", imageUrl: "", pdfUrl: "" });

  useEffect(() => {
    fetch(`/api/catalog/${category}`)
      .then((r) => r.json())
      .then(setRows);
  }, [category]);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const row of rows) {
      const key = row.subcategory || "عام";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return map;
  }, [rows]);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[#9e1b1f]">{decodeURIComponent(category)}</h2>
      {isAdmin ? (
        <div className="mb-5 grid gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm md:grid-cols-2">
          <input className="input" placeholder="العنوان" value={newItem.title} onChange={(e) => setNewItem((s) => ({ ...s, title: e.target.value }))} />
          <input className="input" placeholder="التصنيف الفرعي (اختياري)" value={newItem.subcategory} onChange={(e) => setNewItem((s) => ({ ...s, subcategory: e.target.value }))} />
          <textarea className="input min-h-20" placeholder="المزايا" value={newItem.features} onChange={(e) => setNewItem((s) => ({ ...s, features: e.target.value }))} />
          <textarea className="input min-h-20" placeholder="الوثائق" value={newItem.documents} onChange={(e) => setNewItem((s) => ({ ...s, documents: e.target.value }))} />
          <textarea className="input min-h-20" placeholder="الحد الأدنى" value={newItem.minBalance} onChange={(e) => setNewItem((s) => ({ ...s, minBalance: e.target.value }))} />
          <textarea className="input min-h-20" placeholder="الشروط والأحكام" value={newItem.terms} onChange={(e) => setNewItem((s) => ({ ...s, terms: e.target.value }))} />
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
              const d = await res.json();
              if (res.ok) setNewItem((s) => ({ ...s, imageUrl: d.url }));
            }}
          />
          <input
            type="file"
            accept=".pdf"
            className="text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/uploads", { method: "POST", body: fd });
              const d = await res.json();
              if (res.ok) setNewItem((s) => ({ ...s, pdfUrl: d.url }));
            }}
          />
          <button
            type="button"
            className="rounded-lg bg-[#9e1b1f] px-3 py-2 text-white md:col-span-2"
            onClick={async () => {
              await fetch(`/api/catalog/${category}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: newItem.title,
                  subcategory: newItem.subcategory || null,
                  content: {
                    features: newItem.features,
                    documents: newItem.documents,
                    minBalance: newItem.minBalance,
                    terms: newItem.terms,
                  },
                  imageUrl: newItem.imageUrl || null,
                  pdfUrl: newItem.pdfUrl || null,
                }),
              });
              setNewItem({ title: "", subcategory: "", features: "", documents: "", minBalance: "", terms: "", imageUrl: "", pdfUrl: "" });
              const res = await fetch(`/api/catalog/${category}`);
              setRows(await res.json());
            }}
          >
            إضافة عنصر
          </button>
        </div>
      ) : null}
      <div className="space-y-8">
        {[...grouped.entries()].map(([sub, items]) => (
          <div key={sub}>
            {grouped.size > 1 ? <h3 className="mb-3 border-b border-[#ef7d00]/40 pb-1 text-lg font-semibold text-[#ef7d00]">{sub}</h3> : null}
            <div className="space-y-6">
              {items.map((row) => (
                <CatalogItem key={row.id} row={row} category={category} isAdmin={isAdmin} onChanged={async () => {
                  const res = await fetch(`/api/catalog/${category}`);
                  setRows(await res.json());
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderRichText(text?: string) {
  const value = (text ?? "").trim();
  if (!value) return <span>—</span>;
  const lines = value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((line) => /^(-|\d+[\.\)])\s+/.test(line));
  if (bulletLines.length > 0) {
    return (
      <ul className="list-disc space-y-1 pr-5">
        {lines.map((line, idx) => {
          const cleaned = line.replace(/^(-|\d+[\.\)])\s+/, "");
          return <li key={`${cleaned}-${idx}`}>{cleaned}</li>;
        })}
      </ul>
    );
  }
  return <p className="whitespace-pre-wrap">{value}</p>;
}

function CatalogItem({ row, category, isAdmin, onChanged }: { row: Row; category: string; isAdmin: boolean; onChanged: () => void }) {
  const [tab, setTab] = useState<"features" | "documents" | "minBalance" | "terms">("features");
  const content: Content = JSON.parse(row.contentJson || "{}");
  const [previewPdf, setPreviewPdf] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState({
    title: row.title,
    subcategory: row.subcategory ?? "",
    features: content.features ?? "",
    documents: content.documents ?? "",
    minBalance: content.minBalance ?? "",
    terms: content.terms ?? "",
    imageUrl: row.imageUrl ?? "",
    pdfUrl: row.pdfUrl ?? "",
  });
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <h4 className="text-lg font-semibold text-slate-800">{editMode ? draft.title : row.title}</h4>
      <div className="mt-3 flex flex-wrap gap-2 border-b border-slate-100 pb-2">
        {(
          [
            ["features", "المزايا"],
            ["documents", "الوثائق المطلوبة"],
            ["minBalance", "الحد الأدنى للرصيد"],
            ["terms", "الشروط والأحكام"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === k ? "bg-[#9e1b1f] text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-[80px] text-sm leading-relaxed text-slate-700">
        {tab === "features" && renderRichText(editMode ? draft.features : content.features)}
        {tab === "documents" && renderRichText(editMode ? draft.documents : content.documents)}
        {tab === "minBalance" && renderRichText(editMode ? draft.minBalance : content.minBalance)}
        {tab === "terms" && renderRichText(editMode ? draft.terms : content.terms)}
      </div>
      {(editMode ? draft.imageUrl : row.imageUrl) ? (
        <img src={editMode ? draft.imageUrl : row.imageUrl ?? ""} alt={row.title} className="mt-3 max-h-56 rounded object-contain" />
      ) : null}
      {(editMode ? draft.pdfUrl : row.pdfUrl) ? (
        <button type="button" onClick={() => setPreviewPdf(true)} className="mt-2 inline-block rounded bg-[#ef7d00] px-3 py-1 text-white">
          معاينة PDF
        </button>
      ) : null}
      {isAdmin ? (
        <div className="mt-3">
          {editMode ? (
            <div className="grid gap-2 md:grid-cols-2">
              <input className="input" value={draft.title} onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))} />
              <input className="input" value={draft.subcategory} onChange={(e) => setDraft((s) => ({ ...s, subcategory: e.target.value }))} />
              <textarea className="input min-h-20" value={draft.features} onChange={(e) => setDraft((s) => ({ ...s, features: e.target.value }))} />
              <textarea className="input min-h-20" value={draft.documents} onChange={(e) => setDraft((s) => ({ ...s, documents: e.target.value }))} />
              <textarea className="input min-h-20" value={draft.minBalance} onChange={(e) => setDraft((s) => ({ ...s, minBalance: e.target.value }))} />
              <textarea className="input min-h-20" value={draft.terms} onChange={(e) => setDraft((s) => ({ ...s, terms: e.target.value }))} />
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
                  const d = await res.json();
                  if (res.ok) setDraft((s) => ({ ...s, imageUrl: d.url }));
                }}
              />
              <input
                type="file"
                accept=".pdf"
                className="text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append("file", file);
                  const res = await fetch("/api/uploads", { method: "POST", body: fd });
                  const d = await res.json();
                  if (res.ok) setDraft((s) => ({ ...s, pdfUrl: d.url }));
                }}
              />
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="button"
                  className="rounded bg-emerald-600 px-3 py-1 text-white"
                  onClick={async () => {
                    await fetch(`/api/catalog/${category}/${row.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: draft.title,
                        subcategory: draft.subcategory || null,
                        imageUrl: draft.imageUrl || null,
                        pdfUrl: draft.pdfUrl || null,
                        content: {
                          features: draft.features,
                          documents: draft.documents,
                          minBalance: draft.minBalance,
                          terms: draft.terms,
                        },
                      }),
                    });
                    setEditMode(false);
                    onChanged();
                  }}
                >
                  حفظ التعديل
                </button>
                <button type="button" className="rounded bg-slate-200 px-3 py-1" onClick={() => setEditMode(false)}>
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="ml-3 text-sm text-slate-700" onClick={() => setEditMode(true)}>
              تعديل
            </button>
          )}
          <button
            type="button"
            className="text-sm text-red-600"
            onClick={async () => {
              await fetch(`/api/catalog/${category}/${row.id}`, { method: "DELETE" });
              onChanged();
            }}
          >
            حذف العنصر
          </button>
        </div>
      ) : null}
      {previewPdf ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="h-[85vh] w-[90vw] rounded-lg bg-white p-2">
            <div className="mb-2 flex justify-end">
              <button type="button" className="rounded bg-slate-100 px-2 py-1" onClick={() => setPreviewPdf(false)}>
                إغلاق
              </button>
            </div>
            <iframe src={(editMode ? draft.pdfUrl : row.pdfUrl) ?? ""} className="h-[75vh] w-full rounded border" />
          </div>
        </div>
      ) : null}
    </article>
  );
}
