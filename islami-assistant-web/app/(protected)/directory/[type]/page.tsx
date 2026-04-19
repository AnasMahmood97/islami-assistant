"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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
    load();
  }, [type]);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[#9e1b1f]">{type === "branches" ? "الفروع" : "الصرافات"}</h2>
      {isAdmin ? (
        <form
          className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-[#ef7d00] p-3"
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
          <button type="submit" className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">
            رفع
          </button>
        </form>
      ) : null}
      <div className="mb-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="بحث بالاسم" />
        <button type="button" onClick={() => load(q)} className="rounded-lg bg-[#ef7d00] px-3 py-2 text-white">
          بحث
        </button>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="mb-2 rounded-lg border border-slate-200 p-3 text-sm">
          <p className="font-semibold">{row.name}</p>
          <p>
            {row.city} - {row.address}
          </p>
          <p>{row.phone}</p>
        </div>
      ))}
    </section>
  );
}
