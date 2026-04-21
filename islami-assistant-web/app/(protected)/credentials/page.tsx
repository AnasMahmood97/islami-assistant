"use client";

import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type CredRow = { id: string; system: string; username: string; password: string };

export default function CredentialsPage() {
  const [rows, setRows] = useState<CredRow[]>([]);
  const [form, setForm] = useState({ system: "", username: "", password: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);

  const load = async () => {
    const data = await fetch("/api/credentials").then((r) => r.json());
    setRows(data);
  };
  useEffect(() => {
    fetch("/api/credentials")
      .then((r) => r.json())
      .then((data) => setRows(data));
  }, []);

  return (
    <section className="chat-pane">
      <h2 className="mb-5 text-2xl font-bold text-[#9e1b1f]">اليوزرات</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <article key={row.id} className="group rounded-2xl border border-[#9e1b1f]/20 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{row.system}</p>
              <div className="flex gap-2">
                <button className="admin-hover-action rounded p-1 text-slate-700" onClick={() => setEditId(row.id)}><Pencil className="h-4 w-4" /></button>
                <button
                  className="admin-hover-action rounded p-1 text-red-700"
                  onClick={async () => {
                    await fetch(`/api/credentials/${row.id}`, { method: "DELETE" });
                    load();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm">المستخدم: {row.username}</p>
            <p className="text-sm">كلمة المرور: {showPasswordId === row.id ? row.password : "••••••••"}</p>
            <div className="mt-2 flex gap-2">
              <button className="rounded bg-slate-100 px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(row.username)}>نسخ المستخدم</button>
              <button className="rounded bg-slate-100 px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(row.password)}>نسخ كلمة المرور</button>
              <button className="rounded bg-slate-100 p-1" onClick={() => setShowPasswordId((x) => (x === row.id ? null : row.id))}>
                {showPasswordId === row.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-[#9e1b1f]/30 p-3">
        <div className="grid gap-2 md:grid-cols-3">
          <input className="input" placeholder="المنظومة" value={form.system} onChange={(e) => setForm((s) => ({ ...s, system: e.target.value }))} />
          <input className="input" placeholder="المستخدم" value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
          <input className="input" placeholder="كلمة المرور" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
        </div>
        <button
          type="button"
          className="mt-2 rounded-xl bg-[#9e1b1f] px-3 py-2 text-white"
          onClick={async () => {
            if (editId) {
              await fetch(`/api/credentials/${editId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: form.username, password: form.password }),
              });
            } else {
              await fetch("/api/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
              });
            }
            setForm({ system: "", username: "", password: "" });
            setEditId(null);
            load();
          }}
        >
          {editId ? "حفظ التعديل" : "إضافة يوزر"}
        </button>
      </div>
    </section>
  );
}
