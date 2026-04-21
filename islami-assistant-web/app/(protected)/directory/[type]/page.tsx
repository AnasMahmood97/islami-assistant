"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AdminSection } from "@/components/ui/admin-section";

type Row = { id: string; name: string; city?: string | null; address?: string | null; phone?: string | null };

export default function DirectoryPage() {
  const params = useParams<{ type: string }>();
  const type = params.type;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const load = async (search = "") => {
    const res = await fetch(`/api/directory/${type}?q=${encodeURIComponent(search)}`);
    setRows(await res.json());
  };

  useEffect(() => {
    void fetch(`/api/directory/${type}?q=`)
      .then((r) => r.json())
      .then(setRows);
  }, [type]);

  return (
    <AdminSection title={type === "branches" ? "الفروع" : "الصرافات"}>
      {isAdmin ? (
        <form
          className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-orange-300 p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const res = await fetch(`/api/directory/${type}`, { method: "POST", body: fd });
            const data = await res.json();
            alert(`تم استيراد ${data.imported ?? 0} سطرًا.`);
            load();
          }}
        >
          <label className="text-sm">
            استبدال القائمة من Excel
            <input type="file" name="file" accept=".xlsx,.xls" className="mt-1 block text-sm" />
          </label>
          <button type="submit" className="rounded-xl bg-[#FF7F00] px-3 py-2 text-sm text-white">
            رفع
          </button>
        </form>
      ) : null}
      <div className="mb-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="بحث بالاسم" />
        <button type="button" onClick={() => load(q)} className="rounded-xl bg-[#FF7F00] px-3 py-2 text-white">
          بحث
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-orange-100 bg-white/90">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-orange-50 text-[#8b4300]">
            <tr>
              <th className="p-2 text-right">الاسم</th>
              <th className="p-2 text-right">المدينة</th>
              <th className="p-2 text-right">العنوان</th>
              <th className="p-2 text-right">الهاتف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-orange-100 hover:bg-orange-50/50">
                <td className="p-2 font-semibold">{row.name}</td>
                <td className="p-2">{row.city || "-"}</td>
                <td className="p-2">{row.address || "-"}</td>
                <td className="p-2">{row.phone || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSection>
  );
}
