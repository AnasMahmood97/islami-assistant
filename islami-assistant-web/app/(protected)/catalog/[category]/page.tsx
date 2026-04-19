"use client";

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
  const params = useParams<{ category: string }>();
  const category = params.category;
  const [rows, setRows] = useState<Row[]>([]);

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
      <div className="space-y-8">
        {[...grouped.entries()].map(([sub, items]) => (
          <div key={sub}>
            {grouped.size > 1 ? <h3 className="mb-3 border-b border-[#ef7d00]/40 pb-1 text-lg font-semibold text-[#ef7d00]">{sub}</h3> : null}
            <div className="space-y-6">
              {items.map((row) => (
                <CatalogItem key={row.id} row={row} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CatalogItem({ row }: { row: Row }) {
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
    </article>
  );
}
