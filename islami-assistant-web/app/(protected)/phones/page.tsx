"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
type MailRow = { id: string; title: string };

export default function PhonesPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl bg-white p-8 text-center text-slate-500">جاري التحميل…</div>}>
      <PhonesInner />
    </Suspense>
  );
}

function PhonesInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = sp.get("tab") === "mail" ? "mail" : "phones";
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [gov, setGov] = useState("عمان");
  const [q, setQ] = useState("");
  const [phones, setPhones] = useState<PhoneRow[]>([]);
  const [mails, setMails] = useState<MailRow[]>([]);
  const [mailDetail, setMailDetail] = useState<{ title: string; body: string; instructions?: string | null } | null>(
    null
  );
  const [newPhone, setNewPhone] = useState({ branchName: "", phone: "" });
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [newMail, setNewMail] = useState({ title: "", body: "", instructions: "" });

  const loadPhones = async () => {
    const res = await fetch(`/api/phones?governorate=${encodeURIComponent(gov)}&q=${encodeURIComponent(q)}`);
    setPhones(await res.json());
  };

  const loadMails = async () => {
    const res = await fetch("/api/mail-templates");
    setMails(await res.json());
  };

  useEffect(() => {
    if (!sp.get("tab")) router.replace("/phones?tab=phones");
  }, [router, sp]);

  useEffect(() => {
    void fetch(`/api/phones?governorate=${encodeURIComponent(gov)}&q=`)
      .then((r) => r.json())
      .then(setPhones);
  }, [gov]);

  useEffect(() => {
    void fetch("/api/mail-templates")
      .then((r) => r.json())
      .then(setMails);
  }, []);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[#9e1b1f]">هواتف ومراسلات</h2>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/phones?tab=phones")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "phones" ? "bg-[#9e1b1f] text-white" : "bg-slate-100"}`}
        >
          هواتف
        </button>
        <button
          type="button"
          onClick={() => router.push("/phones?tab=mail")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "mail" ? "bg-[#9e1b1f] text-white" : "bg-slate-100"}`}
        >
          مراسلات
        </button>
      </div>

      {tab === "phones" ? (
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {GOVS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGov(g)}
                className={`rounded-full px-3 py-1 text-sm ${gov === g ? "bg-[#ef7d00] text-white" : "bg-slate-100"}`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="mb-3 flex gap-2">
            <input className="input" placeholder="بحث" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="button" className="rounded-lg bg-[#ef7d00] px-3 py-2 text-white" onClick={loadPhones}>
              بحث
            </button>
          </div>
          <div className="space-y-2">
            {phones.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-2 text-sm">
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
                <div className="flex gap-2">
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
                          className="rounded bg-slate-800 px-2 py-1 text-white"
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
                className="rounded-lg bg-[#9e1b1f] px-3 py-2 text-white"
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold">قائمة المراسلات</h3>
            <ul className="space-y-1">
              {mails.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-right text-sm hover:bg-[#ef7d00]/10"
                    onClick={async () => {
                      const res = await fetch(`/api/mail-templates/${m.id}`);
                      setMailDetail(await res.json());
                    }}
                  >
                    {m.title}
                  </button>
                </li>
              ))}
            </ul>
            {isAdmin ? (
              <div className="mt-4 space-y-2 border-t pt-3">
                <input
                  className="input"
                  placeholder="عنوان"
                  value={newMail.title}
                  onChange={(e) => setNewMail((s) => ({ ...s, title: e.target.value }))}
                />
                <textarea
                  className="input min-h-[100px]"
                  placeholder="نص يُنسخ للبريد"
                  value={newMail.body}
                  onChange={(e) => setNewMail((s) => ({ ...s, body: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="تعليمات للموظف"
                  value={newMail.instructions}
                  onChange={(e) => setNewMail((s) => ({ ...s, instructions: e.target.value }))}
                />
                <button
                  type="button"
                  className="rounded-lg bg-[#9e1b1f] px-3 py-2 text-white"
                  onClick={async () => {
                    await fetch("/api/mail-templates", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(newMail),
                    });
                    setNewMail({ title: "", body: "", instructions: "" });
                    loadMails();
                  }}
                >
                  إضافة مراسلة
                </button>
              </div>
            ) : null}
          </div>
          <div>
            <h3 className="mb-2 font-semibold">التفاصيل</h3>
            {mailDetail ? (
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="mb-2 font-bold">{mailDetail.title}</p>
                {mailDetail.instructions ? <p className="mb-2 text-amber-800">{mailDetail.instructions}</p> : null}
                <pre className="whitespace-pre-wrap rounded bg-slate-50 p-2">{mailDetail.body}</pre>
                <button type="button" className="mt-2 rounded bg-[#ef7d00] px-3 py-1 text-white" onClick={() => clip(mailDetail.body)}>
                  نسخ النص
                </button>
              </div>
            ) : (
              <p className="text-slate-500">اختر مراسلة من القائمة</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function clip(t: string) {
  void navigator.clipboard.writeText(t);
}
