"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

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

export default function FinanceCompaniesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Company[]>([]);
  const [tab, setTab] = useState<CompanyTab>("all");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async (search = "", activeTab: CompanyTab = "all") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance-companies?q=${encodeURIComponent(search)}&tab=${encodeURIComponent(activeTab)}`);
      setRows(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load(q, tab);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [q, tab]);

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
    await load(q, tab);
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
        <button onClick={() => load(q, tab)} className="rounded-xl bg-[#9e1b1f] px-3 py-2 text-white">بحث</button>
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
              await load(q, tab);
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
      <div className="companies-scroll overflow-x-auto rounded-2xl border border-[#E60000]/15 bg-white/90">
      <table className="w-full min-w-[1600px] text-sm">
        <thead>
          <tr className="border-b border-[#E60000]/15 bg-[#E60000]/10">
            {visibleColumns.map((column) =>
              column.key === "name" ? (
                <th key={column.key} className="sticky right-0 z-20 min-w-[220px] bg-[#ffe3e3] p-2 text-right shadow-[-1px_0_0_rgba(230,0,0,0.1)]">
                  {column.label}
                </th>
              ) : (
                <th key={column.key} className="min-w-[170px] p-2 text-right">{column.label}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[#E60000]/15 transition-colors hover:bg-[#E60000]/8">
              {visibleColumns.map((column) =>
                column.key === "name" ? (
                  <td key={column.key} className="sticky right-0 z-10 min-w-[220px] bg-white p-2 font-semibold shadow-[-1px_0_0_rgba(230,0,0,0.08)]">
                    {r.name}
                  </td>
                ) : (
                  <td key={column.key} className="p-2">{r[column.key] || "—"}</td>
                ),
              )}
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
