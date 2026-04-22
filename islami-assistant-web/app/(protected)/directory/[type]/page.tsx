"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { AdminSection } from "@/components/ui/admin-section";
import { Pencil } from "lucide-react";

type Row = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  notes?: string | null;
};
type EditingCell = { rowId: string; field: keyof Row; value: string };

export default function DirectoryPage() {
  const params = useParams<{ type: string }>();
  const type = params.type;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [toast, setToast] = useState("");
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const topScrollInnerRef = useRef<HTMLDivElement | null>(null);
  const syncLockRef = useRef(false);

  const load = async (search = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/directory/${type}?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load(q);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [type, q]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2000);
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
  }, [rows.length, type]);

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
  }, [rows.length, type]);

  const saveCellEdit = async () => {
    if (!editingCell) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/directory/${type}/${editingCell.rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editingCell.field]: editingCell.value }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "تعذر الحفظ");
        return;
      }
      setRows((prev) => prev.map((row) => (row.id === editingCell.rowId ? { ...row, ...data } : row)));
      setEditingCell(null);
      setToast("تم حفظ التعديل");
    } finally {
      setSavingEdit(false);
    }
  };

  const renderCell = (row: Row, field: keyof Row, fallback = "-") => {
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
        <span>{value || fallback}</span>
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
    <AdminSection title={type === "branches" ? "الفروع" : "الصرافات"}>
      {isAdmin ? (
        <form
          className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-[#E60000]/30 p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const res = await fetch(`/api/directory/${type}`, { method: "POST", body: fd });
            const data = await res.json();
            alert(`تم استيراد ${data.imported ?? 0} سطرًا.`);
            load(q);
          }}
        >
          <label className="text-sm">
            استبدال القائمة من Excel
            <input type="file" name="file" accept=".xlsx,.xls" className="mt-1 block text-sm" />
          </label>
          <button type="submit" className="rounded-xl bg-[#E60000] px-3 py-2 text-sm text-white">
            رفع
          </button>
          <button
            type="button"
            className="rounded-xl bg-red-700 px-3 py-2 text-sm text-white"
            onClick={async () => {
              const confirmed = window.confirm("هل أنت متأكد من مسح كافة البيانات؟");
              if (!confirmed) return;
              await fetch(`/api/directory/${type}`, { method: "DELETE" });
              await load(q);
            }}
          >
            مسح كافة البيانات
          </button>
        </form>
      ) : null}
      <div className="mb-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input w-full md:max-w-lg"
          placeholder={type === "branches" ? "بحث ذكي: الموقع + العنوان + الهاتف + صندوق بريد" : "بحث ذكي: الموقع + العنوان"}
        />
        <button type="button" onClick={() => load(q)} className="rounded-xl bg-[#E60000] px-3 py-2 text-white">
          بحث
        </button>
        {loading ? <span className="self-center text-xs text-slate-500">جاري التحديث...</span> : null}
      </div>
      {toast ? <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{toast}</div> : null}
      <div ref={topScrollRef} className="companies-scroll mb-2 overflow-x-auto rounded-lg border border-[#E60000]/10 bg-white/70">
        <div ref={topScrollInnerRef} style={{ width: "1px", height: "1px" }} />
      </div>
      <div ref={bottomScrollRef} className="companies-scroll overflow-x-auto rounded-2xl border border-[#E60000]/15 bg-white/90">
        <table className={`w-full ${type === "branches" ? "min-w-[850px]" : "min-w-[520px]"} text-sm`}>
          <thead className="bg-[#E60000]/10 text-[#7a0b0b]">
            <tr>
              <th className="p-2 text-right">الموقع</th>
              <th className="p-2 text-right">العنوان</th>
              {type === "branches" ? <th className="p-2 text-right">رقم الهاتف</th> : null}
              {type === "branches" ? <th className="p-2 text-right">صندوق بريد</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#E60000]/15 hover:bg-[#E60000]/5">
                <td className="p-2 font-semibold">{renderCell(row, "name")}</td>
                <td className="p-2">{renderCell(row, "address")}</td>
                {type === "branches" ? <td className="p-2">{renderCell(row, "phone")}</td> : null}
                {type === "branches" ? <td className="p-2">{renderCell({ ...row, postalCode: row.postalCode ?? row.notes }, "postalCode")}</td> : null}
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
    </AdminSection>
  );
}
