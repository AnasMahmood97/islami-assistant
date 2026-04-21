"use client";

import { useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { AdminSection } from "@/components/ui/admin-section";

const GOVS = [
  "عمان",
  "اربد",
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
];

type PhoneRow = { id: string; governorate: string; branchName: string; phone: string };
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
  const [newPhone, setNewPhone] = useState({ branchName: "", phone: "" });
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);

  const loadPhones = async () => {
    const res = await fetch(`/api/phones?governorate=${encodeURIComponent(gov)}&q=${encodeURIComponent(q)}`);
    setPhones(await res.json());
  };

  useEffect(() => {
    void fetch(`/api/phones?governorate=${encodeURIComponent(gov)}&q=`)
      .then((r) => r.json())
      .then(setPhones);
  }, [gov]);

  return (
    <AdminSection title="هواتف">
      <div>
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
          <div className="space-y-2">
            {phones.map((p) => (
              <div key={p.id} className="group flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E60000]/15 bg-white/85 p-3 text-sm transition-all duration-300 ease-out hover:bg-[#E60000]/5 hover:shadow-[0_10px_24px_rgba(230,0,0,0.14)]">
                <div>
                  {editingPhoneId === p.id ? (
                    <div className="flex flex-wrap gap-2">
                      <input
                        className="input max-w-xs"
                        value={newPhone.branchName}
                        onChange={(e) => setNewPhone((s) => ({ ...s, branchName: e.target.value }))}
                      />
                      <input
                        className="input max-w-xs"
                        value={newPhone.phone}
                        onChange={(e) => setNewPhone((s) => ({ ...s, phone: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold">{p.branchName}</p>
                      <p className="text-slate-600">{p.phone}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2 opacity-90 transition-all duration-300 group-hover:opacity-100">
                  <button type="button" className="rounded bg-slate-100 px-2 py-1" onClick={() => clip(p.phone)}>
                    نسخ
                  </button>
                  {isAdmin ? (
                    <>
                      {editingPhoneId === p.id ? (
                        <button
                          type="button"
                          className="rounded bg-emerald-600 px-2 py-1 text-white"
                          onClick={async () => {
                            await fetch(`/api/phones/${p.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ governorate: gov, ...newPhone }),
                            });
                            setEditingPhoneId(null);
                            setNewPhone({ branchName: "", phone: "" });
                            loadPhones();
                          }}
                        >
                          حفظ
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded bg-slate-800 px-2 py-1 text-white admin-hover-action"
                          onClick={() => {
                            setEditingPhoneId(p.id);
                            setNewPhone({ branchName: p.branchName, phone: p.phone });
                          }}
                        >
                          تعديل
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded bg-red-600 px-2 py-1 text-white"
                        onClick={async () => {
                          await fetch(`/api/phones/${p.id}`, { method: "DELETE" });
                          loadPhones();
                        }}
                      >
                        حذف
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {isAdmin ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
              <input
                className="input max-w-xs"
                placeholder="اسم الفرع"
                value={newPhone.branchName}
                onChange={(e) => setNewPhone((s) => ({ ...s, branchName: e.target.value }))}
              />
              <input
                className="input max-w-xs"
                placeholder="الهاتف"
                value={newPhone.phone}
                onChange={(e) => setNewPhone((s) => ({ ...s, phone: e.target.value }))}
              />
              <button
                type="button"
                className="rounded-xl bg-[#E60000] px-3 py-2 text-white"
                onClick={async () => {
                  await fetch("/api/phones", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ governorate: gov, ...newPhone }),
                  });
                  setNewPhone({ branchName: "", phone: "" });
                  loadPhones();
                }}
              >
                إضافة
              </button>
            </div>
          ) : null}
      </div>
    </AdminSection>
  );
}
