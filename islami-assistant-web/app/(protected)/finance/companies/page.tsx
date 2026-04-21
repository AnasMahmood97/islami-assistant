"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Company = { id: string; name: string; notes?: string | null; city?: string | null; phone?: string | null };

export default function FinanceCompaniesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Company[]>([]);

  const load = async (search = "") => {
    const res = await fetch(`/api/finance-companies?q=${encodeURIComponent(search)}`);
    setRows(await res.json());
  };

  useEffect(() => {
    void fetch("/api/finance-companies?q=")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  return (
    <section className="chat-pane">
      <h2 className="mb-4 text-xl font-bold text-[#b65600]">الشركات المعتمدة</h2>
      <div className="mb-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم" className="input" />
        <button onClick={() => load(q)} className="rounded-xl bg-[#FF7F00] px-3 py-2 text-white">بحث</button>
        <a href="/api/finance-companies/export" className="rounded-xl bg-slate-700 px-3 py-2 text-white">تصدير Excel</a>
      </div>
      {isAdmin ? (
        <form
          className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-orange-300 p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const file = fd.get("file");
            if (!(file instanceof File) || file.size === 0) return;
            const res = await fetch("/api/finance-companies", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) {
              alert(data.error ?? "فشل الاستيراد");
              return;
            }
            alert(`تمت مزامنة ${data.imported ?? 0} شركة`);
            load(q);
          }}
        >
          <input type="file" name="file" accept=".xlsx,.xls" className="text-sm" />
          <button className="rounded-xl bg-[#FF7F00] px-3 py-2 text-white" type="submit">مزامنة قائمة الشركات</button>
        </form>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-orange-100 bg-white/90">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-orange-100 bg-orange-50">
            <th className="p-2 text-right">الاسم</th>
            <th className="p-2 text-right">المدينة</th>
            <th className="p-2 text-right">الهاتف</th>
            <th className="p-2 text-right">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-orange-100 hover:bg-orange-50/50">
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.city}</td>
              <td className="p-2">{r.phone}</td>
              <td className="p-2">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}
