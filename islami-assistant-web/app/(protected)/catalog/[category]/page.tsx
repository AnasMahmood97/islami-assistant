"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Check, ChevronDown, Pencil } from "lucide-react";

type Row = {
  id: string;
  title: string;
  subcategory: string | null;
  contentJson: string;
  imageUrl?: string | null;
  pdfUrl?: string | null;
};

type Content = {
  summary?: string;
  features?: string;
  documents?: string;
  minBalance?: string;
  terms?: string;
};
type SectionLabels = {
  featuresLabel: string;
  documentsLabel: string;
  minBalanceLabel: string;
  termsLabel: string;
};
const DEFAULT_SECTION_LABELS: SectionLabels = {
  featuresLabel: "المزايا",
  documentsLabel: "الوثائق المطلوبة",
  minBalanceLabel: "الحد الأدنى للرصيد",
  termsLabel: "الشروط والأحكام",
};

export default function CatalogCategoryPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const params = useParams<{ category: string }>();
  const category = params.category;
  const categoryKey = decodeURIComponent(category);
  const [rows, setRows] = useState<Row[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [sectionLabels, setSectionLabels] = useState<SectionLabels>(DEFAULT_SECTION_LABELS);
  const [newItem, setNewItem] = useState({ title: "", subcategory: "", summary: "", features: "", documents: "", minBalance: "", terms: "", imageUrl: "" });

  useEffect(() => {
    fetch(`/api/catalog/${category}`)
      .then((r) => r.json())
      .then(setRows);
  }, [category]);

  useEffect(() => {
    fetch("/api/module-titles")
      .then((r) => r.json())
      .then((data) => {
        setTitles(data ?? {});
        setTitleDraft((data ?? {})[categoryKey] ?? categoryKey);
      });
  }, [categoryKey]);

  useEffect(() => {
    fetch(`/api/catalog-section-labels?category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data) => {
        setSectionLabels({
          featuresLabel: data?.featuresLabel || DEFAULT_SECTION_LABELS.featuresLabel,
          documentsLabel: data?.documentsLabel || DEFAULT_SECTION_LABELS.documentsLabel,
          minBalanceLabel: data?.minBalanceLabel || DEFAULT_SECTION_LABELS.minBalanceLabel,
          termsLabel: data?.termsLabel || DEFAULT_SECTION_LABELS.termsLabel,
        });
      })
      .catch(() => setSectionLabels(DEFAULT_SECTION_LABELS));
  }, [category]);

  const grouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filteredBySubcategory =
      subcategoryFilter === "all" ? rows : rows.filter((row) => (row.subcategory || "عام") === subcategoryFilter);
    const filtered = !q
      ? filteredBySubcategory
      : filteredBySubcategory.filter((row) => {
          const content: Content = JSON.parse(row.contentJson || "{}");
          return (
            row.title.toLowerCase().includes(q) ||
            (row.subcategory ?? "").toLowerCase().includes(q) ||
            (content.summary ?? "").toLowerCase().includes(q)
          );
        });
    const map = new Map<string, Row[]>();
    for (const row of filtered) {
      const key = row.subcategory || "عام";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return map;
  }, [rows, searchQuery, subcategoryFilter]);

  const subcategoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) set.add(row.subcategory || "عام");
    return ["all", ...Array.from(set)];
  }, [rows]);

  return (
    <section className="chat-pane">
      <div className="mb-5 flex items-center gap-2">
        <h2 className="text-2xl font-bold text-[#9e1b1f]">{titles[categoryKey] ?? categoryKey}</h2>
        {isAdmin ? (
          <button type="button" className="rounded p-1 text-[#9e1b1f]" onClick={() => setEditingTitle(true)}>
            <Pencil className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="input w-full md:max-w-lg"
          placeholder="بحث فوري بالاسم أو التصنيف أو الوصف"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="input w-full md:w-64"
          value={subcategoryFilter}
          onChange={(e) => setSubcategoryFilter(e.target.value)}
        >
          {subcategoryOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "كل التصنيفات الفرعية" : option}
            </option>
          ))}
        </select>
      </div>
      {isAdmin ? (
        <div className="mb-6 grid gap-3 rounded-2xl border border-dashed border-[#E60000]/30 p-3 text-sm md:grid-cols-2 md:p-4">
          <input className="input" placeholder="العنوان" value={newItem.title} onChange={(e) => setNewItem((s) => ({ ...s, title: e.target.value }))} />
          <input className="input" placeholder="التصنيف الفرعي (اختياري)" value={newItem.subcategory} onChange={(e) => setNewItem((s) => ({ ...s, subcategory: e.target.value }))} />
          <div>
            <textarea
              className="input min-h-20"
              placeholder="شرح بسيط (حد أقصى 150 حرف)"
              maxLength={150}
              value={newItem.summary}
              onChange={(e) => setNewItem((s) => ({ ...s, summary: e.target.value.slice(0, 150) }))}
            />
            <p className="mt-1 text-xs text-slate-500">{newItem.summary.length}/150</p>
          </div>
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
              const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
              const d = await res.json();
              if (res.ok) setNewItem((s) => ({ ...s, imageUrl: d.path }));
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
                    summary: newItem.summary,
                    features: newItem.features,
                    documents: newItem.documents,
                    minBalance: newItem.minBalance,
                    terms: newItem.terms,
                  },
                  imageUrl: newItem.imageUrl || null,
                }),
              });
              setNewItem({ title: "", subcategory: "", summary: "", features: "", documents: "", minBalance: "", terms: "", imageUrl: "" });
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
            {grouped.size > 1 ? <h3 className="mb-3 border-b border-[#E60000]/30 pb-1 text-lg font-semibold text-[#E60000]">{sub}</h3> : null}
            <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((row) => (
                <CatalogItem
                  key={row.id}
                  row={row}
                  category={category}
                  isAdmin={isAdmin}
                  labels={sectionLabels}
                  onSaveLabel={async (patch) => {
                    const res = await fetch("/api/catalog-section-labels", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ category, ...patch }),
                    });
                    if (!res.ok) return;
                    const data = await res.json();
                    setSectionLabels({
                      featuresLabel: data?.featuresLabel || sectionLabels.featuresLabel,
                      documentsLabel: data?.documentsLabel || sectionLabels.documentsLabel,
                      minBalanceLabel: data?.minBalanceLabel || sectionLabels.minBalanceLabel,
                      termsLabel: data?.termsLabel || sectionLabels.termsLabel,
                    });
                  }}
                  onChanged={async () => {
                    const res = await fetch(`/api/catalog/${category}`);
                    setRows(await res.json());
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        {grouped.size === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
            عذراً، لا توجد نتائج تطابق بحثك
          </div>
        ) : null}
      </div>
      {editingTitle ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-card w-full max-w-md bg-white p-4">
            <h3 className="mb-2 font-semibold">تعديل اسم القسم</h3>
            <input className="input mb-3" value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl bg-[#9e1b1f] px-3 py-2 text-white"
                onClick={async () => {
                  await fetch("/api/module-titles", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: categoryKey, title: titleDraft }),
                  });
                  setTitles((s) => ({ ...s, [categoryKey]: titleDraft }));
                  setEditingTitle(false);
                }}
              >
                حفظ
              </button>
              <button type="button" className="rounded-xl bg-slate-200 px-3 py-2" onClick={() => setEditingTitle(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      ) : null}
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

function CatalogItem({
  row,
  category,
  isAdmin,
  labels,
  onSaveLabel,
  onChanged,
}: {
  row: Row;
  category: string;
  isAdmin: boolean;
  labels: SectionLabels;
  onSaveLabel: (patch: Partial<SectionLabels>) => Promise<void>;
  onChanged: () => void;
}) {
  const content: Content = JSON.parse(row.contentJson || "{}");
  const [expanded, setExpanded] = useState(false);
  const [openSection, setOpenSection] = useState<null | "features" | "documents" | "minBalance" | "terms">(null);
  const [editMode, setEditMode] = useState(false);
  const [imageSrc, setImageSrc] = useState(row.imageUrl || "/placeholder-product.svg");
  const [editingLabel, setEditingLabel] = useState<null | keyof SectionLabels>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [draft, setDraft] = useState({
    title: row.title,
    subcategory: row.subcategory ?? "",
    summary: (content.summary ?? "").slice(0, 150),
    features: content.features ?? "",
    documents: content.documents ?? "",
    minBalance: content.minBalance ?? "",
    terms: content.terms ?? "",
    imageUrl: row.imageUrl ?? "",
  });
  useEffect(() => {
    setImageSrc((editMode ? draft.imageUrl : row.imageUrl) || "/placeholder-product.svg");
  }, [row.imageUrl, draft.imageUrl, editMode]);
  return (
    <article className="group glass-card relative flex h-full min-h-[420px] flex-col p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(255,127,0,0.2)] md:p-5">
      {isAdmin && !editMode ? (
        <button
          type="button"
          className="admin-hover-action absolute left-3 top-3 rounded-full border border-[#E60000]/20 bg-white p-2 text-[#E60000]"
          onClick={() => setEditMode(true)}
          title="تعديل"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : null}
      <div className="mb-3 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-white">
        <img
          src={imageSrc}
          alt={row.title}
          className="h-full w-full object-cover"
          onError={() => setImageSrc("/placeholder-product.svg")}
        />
      </div>
      <h4 className="text-lg font-semibold text-slate-800">{editMode ? draft.title : row.title}</h4>
      <p className="mt-2 line-clamp-2 min-h-[48px] text-sm text-slate-600">{(editMode ? draft.summary : content.summary) || "—"}</p>
      <div className="mt-3">
        <button type="button" className="rounded-xl bg-[#E60000] px-3 py-1.5 text-white" onClick={() => setExpanded((s) => !s)}>
          التفاصيل
        </button>
      </div>
      {expanded ? (
        <div className="mt-3 space-y-3 rounded-xl border border-[#E60000]/20 bg-[#fff8f8] p-3 text-sm leading-7 text-slate-700">
          {([
            ["features", labels.featuresLabel, editMode ? draft.features : content.features, "featuresLabel"],
            ["documents", labels.documentsLabel, editMode ? draft.documents : content.documents, "documentsLabel"],
            ["minBalance", labels.minBalanceLabel, editMode ? draft.minBalance : content.minBalance, "minBalanceLabel"],
            ["terms", labels.termsLabel, editMode ? draft.terms : content.terms, "termsLabel"],
          ] as const).map(([key, label, value, labelKey]) => {
            const isOpen = openSection === key;
            const isEditingLabel = editingLabel === labelKey;
            return (
              <section key={key} className="rounded-lg border border-[#E60000]/15 bg-white">
                <div className="flex items-center justify-between px-3 py-2">
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-between text-right"
                    onClick={() => setOpenSection((prev) => (prev === key ? null : key))}
                  >
                    {isEditingLabel ? (
                      <input
                        className="input h-8 max-w-[220px] py-1 text-sm"
                        value={labelDraft}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setLabelDraft(e.target.value)}
                      />
                    ) : (
                      <h5 className="font-semibold text-[#9e1b1f]">{label}</h5>
                    )}
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isAdmin ? (
                    <div className="mr-2 flex items-center gap-1">
                      {isEditingLabel ? (
                        <button
                          type="button"
                          className="rounded p-1 text-emerald-700 hover:bg-emerald-50"
                          title="حفظ العنوان"
                          onClick={async () => {
                            if (!labelDraft.trim()) return;
                            await onSaveLabel({ [labelKey]: labelDraft.trim() });
                            setEditingLabel(null);
                          }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded p-1 text-slate-500 hover:bg-slate-100"
                          title="تعديل عنوان القسم"
                          onClick={() => {
                            setEditingLabel(labelKey);
                            setLabelDraft(label);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
                {isOpen ? <div className="border-t border-[#E60000]/10 px-3 py-2">{renderRichText(value)}</div> : null}
              </section>
            );
          })}
        </div>
      ) : null}
      {isAdmin ? (
        <div className="mt-4">
          {editMode ? (
            <div className="grid gap-2 md:grid-cols-2">
              <input className="input" value={draft.title} onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))} />
              <input className="input" value={draft.subcategory} onChange={(e) => setDraft((s) => ({ ...s, subcategory: e.target.value }))} />
              <div>
                <textarea
                  className="input min-h-20"
                  maxLength={150}
                  value={draft.summary}
                  onChange={(e) => setDraft((s) => ({ ...s, summary: e.target.value.slice(0, 150) }))}
                />
                <p className="mt-1 text-xs text-slate-500">{draft.summary.length}/150</p>
              </div>
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
                  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                  const d = await res.json();
                  if (res.ok) setDraft((s) => ({ ...s, imageUrl: d.path }));
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
                        content: {
                          summary: draft.summary,
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
            <button type="button" className="ml-3 text-sm text-slate-700 admin-hover-action" onClick={() => setEditMode(true)}>
              تعديل
            </button>
          )}
          <button
            type="button"
            className="text-sm text-red-600 admin-hover-action"
            onClick={async () => {
              await fetch(`/api/catalog/${category}/${row.id}`, { method: "DELETE" });
              onChanged();
            }}
          >
            حذف العنصر
          </button>
        </div>
      ) : null}
    </article>
  );
}
