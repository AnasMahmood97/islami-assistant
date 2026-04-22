"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";

type Company = {
  id: string;
  name: string;
  notes?: string | null;
  category?: string | null;
  profitRateInfo?: string | null;
  expiryDate?: string | null;
  murabaha_1_4?: string | null;
  murabaha_5_7?: string | null;
  murabaha_8_10?: string | null;
  murabaha_un_1_4?: string | null;
  murabaha_un_5_7?: string | null;
  murabaha_un_8_10?: string | null;
  ijara_1_7?: string | null;
  ijara_8_15?: string | null;
  ijara_15_20?: string | null;
  ijara_21_25?: string | null;
  ijara_un_1_7?: string | null;
  ijara_un_8_15?: string | null;
  ijara_un_15_20?: string | null;
  ijara_un_21_25?: string | null;
  stocks_1_4?: string | null;
  stocks_5_7?: string | null;
  stocks_8_10?: string | null;
  stocks_un_1_4?: string | null;
  stocks_un_5_7?: string | null;
  stocks_un_8_10?: string | null;
};

type CompanyTab = "all" | "murabaha" | "ijara" | "stocks";
type ColumnDef = { key: keyof Company; label: string };
type GroupHeader = { key: "murabaha" | "ijara" | "stocks"; label: string; colSpan: number };
type EditingCell = { rowId: string; field: keyof Company; value: string };

export default function FinanceCompaniesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Company[]>([]);
  const [tab, setTab] = useState<CompanyTab>("all");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const topScrollInnerRef = useRef<HTMLDivElement | null>(null);
  const syncLockRef = useRef(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [toast, setToast] = useState("");

  const load = async (search = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance-companies?q=${encodeURIComponent(search)}`);
      setRows(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load(q);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [q]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const tableContainer = bottomScrollRef.current;
    const topInner = topScrollInnerRef.current;
    if (!tableContainer || !topInner) return;

    const updateTopWidth = () => {
      topInner.style.width = `${tableContainer.scrollWidth}px`;
    };

    updateTopWidth();
    const observer = new ResizeObserver(() => updateTopWidth());
    observer.observe(tableContainer);
    return () => observer.disconnect();
  }, [tab, rows.length]);

  useEffect(() => {
    const top = topScrollRef.current;
    const tableContainer = bottomScrollRef.current;
    if (!top || !tableContainer) return;

    const syncTop = () => {
      if (syncLockRef.current || !top || !tableContainer) return;
      syncLockRef.current = true;
      top.scrollLeft = tableContainer.scrollLeft;
      syncLockRef.current = false;
    };

    const syncTable = () => {
      if (syncLockRef.current || !top || !tableContainer) return;
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
  }, [rows.length, tab]);

  const coreColumns: ColumnDef[] = [
    { key: "name", label: "اسم الشركة" },
    { key: "notes", label: "ملاحظات" },
    { key: "category", label: "فئة الاعتماد" },
    { key: "profitRateInfo", label: "نسب الربح" },
    { key: "expiryDate", label: "تاريخ الانتهاء" },
  ];

  const murabahaColumns: ColumnDef[] = [
    { key: "murabaha_1_4", label: "محول (1-4 سنوات)" },
    { key: "murabaha_5_7", label: "محول (5-7 سنوات)" },
    { key: "murabaha_8_10", label: "محول (8-10 سنوات)" },
    { key: "murabaha_un_1_4", label: "غير محول (1-4 سنوات)" },
    { key: "murabaha_un_5_7", label: "غير محول (5-7 سنوات)" },
    { key: "murabaha_un_8_10", label: "غير محول (8-10 سنوات)" },
  ];

  const ijaraColumns: ColumnDef[] = [
    { key: "ijara_1_7", label: "محول (1-7 سنوات)" },
    { key: "ijara_8_15", label: "محول (8-15 سنة)" },
    { key: "ijara_15_20", label: "محول (15-20 سنة)" },
    { key: "ijara_21_25", label: "محول (21-25 سنة)" },
    { key: "ijara_un_1_7", label: "غير محول (1-7 سنوات)" },
    { key: "ijara_un_8_15", label: "غير محول (8-15 سنة)" },
    { key: "ijara_un_15_20", label: "غير محول (15-20 سنة)" },
    { key: "ijara_un_21_25", label: "غير محول (21-25 سنة)" },
  ];

  const stocksColumns: ColumnDef[] = [
    { key: "stocks_1_4", label: "محول (1-4 سنوات)" },
    { key: "stocks_5_7", label: "محول (5-7 سنوات)" },
    { key: "stocks_8_10", label: "محول (8-10 سنوات)" },
    { key: "stocks_un_1_4", label: "غير محول (1-4 سنوات)" },
    { key: "stocks_un_5_7", label: "غير محول (5-7 سنوات)" },
    { key: "stocks_un_8_10", label: "غير محول (8-10 سنوات)" },
  ];

  const tabColumns = tab === "murabaha" ? murabahaColumns : tab === "ijara" ? ijaraColumns : tab === "stocks" ? stocksColumns : [...murabahaColumns, ...ijaraColumns, ...stocksColumns];
  const visibleColumns = [...coreColumns, ...tabColumns];
  const groupedHeaders: GroupHeader[] =
    tab === "murabaha"
      ? [{ key: "murabaha", label: "المرابحة", colSpan: murabahaColumns.length }]
      : tab === "ijara"
        ? [{ key: "ijara", label: "الإجارة", colSpan: ijaraColumns.length }]
        : tab === "stocks"
          ? [{ key: "stocks", label: "الأسهم", colSpan: stocksColumns.length }]
          : [
              { key: "murabaha", label: "المرابحة", colSpan: murabahaColumns.length },
              { key: "ijara", label: "الإجارة", colSpan: ijaraColumns.length },
              { key: "stocks", label: "الأسهم", colSpan: stocksColumns.length },
            ];

  const importExcel = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/finance-companies", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "فشل الاستيراد");
      return;
    }
    alert(`تمت مزامنة ${data.imported ?? 0} شركة`);
    await load(q);
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;
    setSavingEdit(true);
    try {
      const payload = { [editingCell.field]: editingCell.value };
      const res = await fetch(`/api/finance-companies/${editingCell.rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "تعذر حفظ التعديل");
        return;
      }
      setRows((prev) => prev.map((row) => (row.id === editingCell.rowId ? { ...row, ...data } : row)));
      setEditingCell(null);
      setToast("تم حفظ التعديل بنجاح");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <section className="chat-pane">
      <h2 className="mb-4 text-xl font-bold text-[#E60000]">الشركات المعتمدة</h2>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث فوري: اسم الشركة / فئة الاعتماد / ملاحظات"
          className="input min-w-[320px] flex-1"
        />
        <button onClick={() => load(q)} className="rounded-xl bg-[#9e1b1f] px-3 py-2 text-white">بحث</button>
        {session?.user?.role === "ADMIN" ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await importExcel(file);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              className="rounded-xl bg-[#E60000] px-3 py-2 text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              استيراد من إكسيل
            </button>
          </>
        ) : null}
        {isAdmin ? <a href="/api/finance-companies/export" className="rounded-xl bg-slate-700 px-3 py-2 text-white">تصدير Excel</a> : null}
      </div>
      {isAdmin ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-[#E60000]/30 p-3">
          <button
            type="button"
            className="rounded-xl bg-red-700 px-3 py-2 text-white"
            onClick={async () => {
              const confirmed = window.confirm("هل أنت متأكد من مسح البيانات الحالية؟");
              if (!confirmed) return;
              await fetch("/api/admin/companies", { method: "DELETE" });
              await load(q);
            }}
          >
            مسح البيانات الحالية
          </button>
        </div>
      ) : null}
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { key: "all" as const, label: "الكل" },
          { key: "murabaha" as const, label: "مرابحة" },
          { key: "ijara" as const, label: "إجارة" },
          { key: "stocks" as const, label: "أسهم" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm ${tab === item.key ? "bg-[#E60000] text-white" : "bg-[#E60000]/10 text-[#7a0b0b]"}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
        {loading ? <span className="self-center text-xs text-slate-500">جاري التحديث...</span> : null}
      </div>
      {toast ? (
        <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{toast}</div>
      ) : null}
      <div ref={topScrollRef} className="companies-scroll mb-2 overflow-x-auto rounded-lg border border-[#E60000]/10 bg-white/70">
        <div ref={topScrollInnerRef} style={{ width: "1px", height: "1px" }} />
      </div>
      <div ref={bottomScrollRef} className="companies-scroll overflow-x-auto rounded-2xl border border-[#E60000]/15 bg-white/90">
      <table className="w-full min-w-[1600px] text-sm">
        <thead>
          <tr className="border-b border-[#E60000]/15 bg-[#E60000]/10">
            {coreColumns.map((column) =>
              column.key === "name" ? (
                <th
                  key={column.key}
                  rowSpan={2}
                  className="sticky right-0 z-30 min-w-[220px] bg-[#ffe3e3] p-2 text-right shadow-[-1px_0_0_rgba(230,0,0,0.1)]"
                >
                  {column.label}
                </th>
              ) : (
                <th key={column.key} rowSpan={2} className="min-w-[170px] p-2 text-right">{column.label}</th>
              ),
            )}
            {groupedHeaders.map((group) => (
              <th key={group.key} colSpan={group.colSpan} className="min-w-[220px] border-r border-[#E60000]/20 p-2 text-center font-bold text-[#7a0b0b]">
                {group.label}
              </th>
            ))}
          </tr>
          <tr className="border-b border-[#E60000]/15 bg-[#fff1f1]">
            {tabColumns.map((column) =>
              column.key === "name" ? (
                <th key={column.key} className="min-w-[170px] p-2 text-right">{column.label}</th>
              ) : (
                <th key={column.key} className="min-w-[170px] p-2 text-right">{column.label}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[#E60000]/15 transition-colors hover:bg-[#E60000]/8">
              {visibleColumns.map((column) => {
                const isEditing = editingCell?.rowId === r.id && editingCell?.field === column.key;
                const rawValue = r[column.key];
                const value = rawValue == null ? "" : String(rawValue);
                const canEdit = isAdmin;
                return column.key === "name" ? (
                  <td key={column.key} className="sticky right-0 z-10 min-w-[220px] bg-white p-2 font-semibold shadow-[-1px_0_0_rgba(230,0,0,0.08)]">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="input h-8 min-w-[140px] py-1"
                          value={editingCell.value}
                          onChange={(e) => setEditingCell((s) => (s ? { ...s, value: e.target.value } : s))}
                        />
                        <button type="button" disabled={savingEdit} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={saveCellEdit}>حفظ</button>
                        <button type="button" disabled={savingEdit} className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => setEditingCell(null)}>إلغاء</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span>{value || "—"}</span>
                        {canEdit ? (
                          <button
                            type="button"
                            className="rounded p-1 text-[#E60000] hover:bg-[#E60000]/10"
                            onClick={() => setEditingCell({ rowId: r.id, field: column.key, value })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </td>
                ) : (
                  <td key={column.key} className="p-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="input h-8 min-w-[120px] py-1"
                          value={editingCell.value}
                          onChange={(e) => setEditingCell((s) => (s ? { ...s, value: e.target.value } : s))}
                        />
                        <button type="button" disabled={savingEdit} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={saveCellEdit}>حفظ</button>
                        <button type="button" disabled={savingEdit} className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={() => setEditingCell(null)}>إلغاء</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span>{value || "—"}</span>
                        {canEdit ? (
                          <button
                            type="button"
                            className="rounded p-1 text-[#E60000] hover:bg-[#E60000]/10"
                            onClick={() => setEditingCell({ rowId: r.id, field: column.key, value })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    )}
                  </td>
                );
              })}
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
    </section>
  );
}
