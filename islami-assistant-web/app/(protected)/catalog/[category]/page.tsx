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
  const [newItem, setNewItem] = useState({ title: "", subcategory: "", features: "", documents: "", minBalance: "", terms: "" });

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
                }),
              });
              setNewItem({ title: "", subcategory: "", features: "", documents: "", minBalance: "", terms: "" });
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
                <CatalogItem key={row.id} row={row} category={category} isAdmin={isAdmin} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CatalogItem({ row, category, isAdmin }: { row: Row; category: string; isAdmin: boolean }) {
  const [tab, setTab] = useState<"features" | "documents" | "minBalance" | "terms">("features");
  const content: Content = JSON.parse(row.contentJson || "{}");
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <h4 className="text-lg font-semibold text-slate-800">{row.title}</h4>
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
        {tab === "features" && (content.features ?? "—")}
        {tab === "documents" && (content.documents ?? "—")}
        {tab === "minBalance" && (content.minBalance ?? "—")}
        {tab === "terms" && (content.terms ?? "—")}
      </div>
      {row.imageUrl ? (
        <img src={row.imageUrl} alt={row.title} className="mt-3 max-h-56 rounded object-contain" />
      ) : null}
      {row.pdfUrl ? (
        <a className="mt-2 inline-block rounded bg-[#ef7d00] px-3 py-1 text-white" href={row.pdfUrl}>
          تحميل PDF
        </a>
      ) : null}
      {isAdmin ? (
        <div className="mt-3">
          <button
            type="button"
            className="text-sm text-red-600"
            onClick={async () => {
              await fetch(`/api/catalog/${category}/${row.id}`, { method: "DELETE" });
              location.reload();
            }}
          >
            حذف العنصر
          </button>
        </div>
      ) : null}
    </article>
  );
}
