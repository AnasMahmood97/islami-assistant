"use client";

import { useEffect, useState } from "react";

type Company = { id: string; name: string; notes?: string | null; city?: string | null; phone?: string | null };

export default function FinanceCompaniesPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Company[]>([]);

  const load = async (search = "") => {
    const res = await fetch(`/api/finance-companies?q=${encodeURIComponent(search)}`);
    setRows(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[#9e1b1f]">الشركات المعتمدة</h2>
      <div className="mb-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم" className="input" />
        <button onClick={() => load(q)} className="rounded-lg bg-[#ef7d00] px-3 py-2 text-white">بحث</button>
        <a href="/api/finance-companies/export" className="rounded-lg bg-slate-700 px-3 py-2 text-white">تصدير Excel</a>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-right">الاسم</th>
            <th className="p-2 text-right">المدينة</th>
            <th className="p-2 text-right">الهاتف</th>
            <th className="p-2 text-right">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.city}</td>
              <td className="p-2">{r.phone}</td>
              <td className="p-2">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
