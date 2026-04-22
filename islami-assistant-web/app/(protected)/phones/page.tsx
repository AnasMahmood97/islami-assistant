"use client";

import { useSession } from "next-auth/react";
import { Suspense, useEffect, useRef, useState } from "react";
import { AdminSection } from "@/components/ui/admin-section";
import { Pencil } from "lucide-react";

const GOVS = [
  "عمان",
  "إربد",
  "الزرقاء",
  "جرش",
  "المفرق",
  "الكرك",
  "مادبا",
  "البلقاء",
  "الطفيلة",
  "عجلون",
  "معان",
  "العقبة",
  "أخرى",
];

type PhoneRow = {
  id: string;
  governorate: string;
  location: string;
  address?: string | null;
  extension?: string | null;
  phone: string;
  poBox?: string | null;
};
type EditingCell = { rowId: string; field: keyof PhoneRow; value: string };
export default function PhonesPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl bg-white p-8 text-center text-slate-500">جاري التحميل…</div>}>
      <PhonesInner />
    </Suspense>
  );
}

function clip(t: string) {
  void navigator.clipboard.writeText(t);
}

function PhonesInner() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [gov, setGov] = useState("عمان");
  const [q, setQ] = useState("");
  const [phones, setPhones] = useState<PhoneRow[]>([]);
  const [newPhone, setNewPhone] = useState({ location: "", address: "", extension: "", phone: "", poBox: "" });
  const [cityToImport, setCityToImport] = useState("عمان");
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [toast, setToast] = useState("");
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const topScrollInnerRef = useRef<HTMLDivElement | null>(null);
  const syncLockRef = useRef(false);

  const loadPhones = async () => {
    const res = await fetch(`/api/phones?governorate=${encodeURIComponent(gov)}&q=${encodeURIComponent(q)}`);
    setPhones(await res.json());
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPhones();
    }, 220);
    return () => window.clearTimeout(timeoutId);
  }, [gov, q]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const tableContainer = bottomScrollRef.current;
    const topInner = topScrollInnerRef.current;
    if (!tableContainer || !topInner) return;
    const updateWidth = () => {
      topInner.style.width = `${tableContainer.scrollWidth}px`;
    };
    updateWidth();
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(tableContainer);
    return () => observer.disconnect();
  }, [phones.length, gov]);

  useEffect(() => {
    const top = topScrollRef.current;
    const tableContainer = bottomScrollRef.current;
    if (!top || !tableContainer) return;
    const syncTop = () => {
      if (syncLockRef.current) return;
      syncLockRef.current = true;
      top.scrollLeft = tableContainer.scrollLeft;
      syncLockRef.current = false;
    };
    const syncTable = () => {
      if (syncLockRef.current) return;
      syncLockRef.current = true;
      tableContainer.scrollLeft = top.scrollLeft;
      syncLockRef.current = false;
    };
    top.addEventListener("scroll", syncTable);
    tableContainer.addEventListener("scroll", syncTop);
    syncTop();
    return () => {
      top.removeEventListener("scroll", syncTable);
      tableContainer.removeEventListener("scroll", syncTop);
    };
  }, [phones.length, gov]);

  const saveCellEdit = async () => {
    if (!editingCell) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/phones/${editingCell.rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editingCell.field]: editingCell.value }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "تعذر الحفظ");
        return;
      }
      setPhones((prev) => prev.map((row) => (row.id === editingCell.rowId ? { ...row, ...data } : row)));
      setEditingCell(null);
      setToast("تم حفظ التعديل");
    } finally {
      setSavingEdit(false);
    }
  };

  const renderHighlighted = (text: string) => {
    const value = String(text ?? "");
    const keywords = q.trim().split(/\s+/).filter(Boolean);
    if (keywords.length === 0) return <>{value || "-"}</>;
    const escaped = keywords.map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = value.split(regex);
    return (
      <>
        {parts.map((part, idx) =>
          regex.test(part) ? (
            <mark key={`${part}-${idx}`} className="rounded bg-yellow-200 px-0.5">{part}</mark>
          ) : (
            <span key={`${part}-${idx}`}>{part}</span>
          )
        )}
      </>
    );
  };

  const renderCell = (row: PhoneRow, field: keyof PhoneRow) => {
    const value = row[field] == null ? "" : String(row[field]);
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === field;
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <input
            className="input h-8 min-w-[120px] py-1"
            value={editingCell.value}
            onChange={(e) => setEditingCell((s) => (s ? { ...s, value: e.target.value } : s))}
          />
          <button type="button" disabled={savingEdit} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={saveCellEdit}>حفظ</button>
          <button type="button" disabled={savingEdit} className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => setEditingCell(null)}>إلغاء</button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{renderHighlighted(value || "-")}</span>
        {isAdmin ? (
          <button
            type="button"
            className="rounded p-1 text-[#E60000] hover:bg-[#E60000]/10"
            onClick={() => setEditingCell({ rowId: row.id, field, value })}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <AdminSection title="هواتف">
      <div>
          {isAdmin ? (
            <div className="mb-4 rounded-2xl border border-dashed border-[#E60000]/30 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <label className="text-sm">المحافظة</label>
                <select className="input max-w-xs" value={cityToImport} onChange={(e) => setCityToImport(e.target.value)}>
                  {GOVS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <input type="file" name="file" accept=".xlsx,.xls" className="text-sm" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append("governorate", cityToImport);
                  fd.append("file", file);
                  const res = await fetch("/api/phones", { method: "POST", body: fd });
                  const data = await res.json();
                  if (!res.ok) return alert(data.error ?? "فشل الاستيراد");
                  alert(`تم استيراد ${data.imported ?? 0} سجلًا لمحافظة ${cityToImport}`);
                  await loadPhones();
                }} />
                <button
                  type="button"
                  className="rounded-xl bg-red-700 px-3 py-2 text-sm text-white"
                  onClick={async () => {
                    if (!confirm("هل أنت متأكد من مسح كافة البيانات؟")) return;
                    await fetch(`/api/phones?governorate=${encodeURIComponent(gov)}`, { method: "DELETE" });
                    await loadPhones();
                  }}
                >
                  مسح كافة البيانات
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-5">
                <input className="input" placeholder="الموقع" value={newPhone.location} onChange={(e) => setNewPhone((s) => ({ ...s, location: e.target.value }))} />
                <input className="input" placeholder="العنوان" value={newPhone.address} onChange={(e) => setNewPhone((s) => ({ ...s, address: e.target.value }))} />
                <input className="input" placeholder="فرعي" value={newPhone.extension} onChange={(e) => setNewPhone((s) => ({ ...s, extension: e.target.value }))} />
                <input className="input" placeholder="رقم الهاتف" value={newPhone.phone} onChange={(e) => setNewPhone((s) => ({ ...s, phone: e.target.value }))} />
                <input className="input" placeholder="صندوق بريد" value={newPhone.poBox} onChange={(e) => setNewPhone((s) => ({ ...s, poBox: e.target.value }))} />
              </div>
              <button
                type="button"
                className="mt-2 rounded-xl bg-[#E60000] px-3 py-2 text-white"
                onClick={async () => {
                  const res = await fetch("/api/phones", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ governorate: gov, ...newPhone }),
                  });
                  if (!res.ok) return alert("تعذر الإضافة");
                  const created = await res.json();
                  setPhones((prev) => [created, ...prev]);
                  setNewPhone({ location: "", address: "", extension: "", phone: "", poBox: "" });
                }}
              >
                إضافة
              </button>
            </div>
          ) : null}
          <div className="mb-4 flex flex-wrap gap-2">
            {GOVS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGov(g)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-all duration-300 ${gov === g ? "bg-[#E60000] text-white" : "bg-[#E60000]/10 text-[#7a0b0b] hover:bg-[#E60000]/15"}`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="mb-4 flex gap-2">
            <input className="input" placeholder="بحث" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="button" className="rounded-xl bg-[#E60000] px-3 py-2 text-white" onClick={loadPhones}>
              بحث
            </button>
          </div>
          {toast ? <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{toast}</div> : null}
          <div ref={topScrollRef} className="companies-scroll mb-2 overflow-x-auto rounded-lg border border-[#E60000]/10 bg-white/70">
            <div ref={topScrollInnerRef} style={{ width: "1px", height: "1px" }} />
          </div>
          <div ref={bottomScrollRef} className="companies-scroll overflow-x-auto rounded-2xl border border-[#E60000]/15 bg-white/90">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-[#E60000]/10 text-[#7a0b0b]">
                <tr>
                  <th className="p-2 text-right">الموقع</th>
                  <th className="p-2 text-right">العنوان</th>
                  <th className="p-2 text-right">فرعي</th>
                  <th className="p-2 text-right">رقم الهاتف</th>
                  <th className="p-2 text-right">صندوق بريد</th>
                </tr>
              </thead>
              <tbody>
                {phones.map((p) => (
                  <tr key={p.id} className="border-t border-[#E60000]/15 hover:bg-[#E60000]/5">
                    <td className="p-2 font-semibold">{renderCell(p, "location")}</td>
                    <td className="p-2">{renderCell(p, "address")}</td>
                    <td className="p-2">{renderCell(p, "extension")}</td>
                    <td className="p-2">{renderCell(p, "phone")}</td>
                    <td className="p-2">{renderCell(p, "poBox")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <style jsx>{`
            .companies-scroll::-webkit-scrollbar {
              height: 8px;
            }
            .companies-scroll::-webkit-scrollbar-track {
              background: #f6f6f6;
              border-radius: 999px;
            }
            .companies-scroll::-webkit-scrollbar-thumb {
              background: #d9d9d9;
              border-radius: 999px;
            }
            .companies-scroll::-webkit-scrollbar-thumb:hover {
              background: #bfbfbf;
            }
          `}</style>
      </div>
    </AdminSection>
  );
}
