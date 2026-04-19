"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type LinkRow = { id: string; system: string; url: string };
type CredRow = { id: string; system: string; username: string; password: string };

export default function LinksPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl bg-white p-8 text-center text-slate-500">جاري التحميل…</div>}>
      <LinksInner />
    </Suspense>
  );
}

function LinksInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = sp.get("tab") === "creds" ? "creds" : "links";
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [links, setLinks] = useState<LinkRow[]>([]);
  const [creds, setCreds] = useState<CredRow[]>([]);
  const [newLink, setNewLink] = useState({ system: "", url: "" });
  const [newCred, setNewCred] = useState({ system: "", username: "", password: "" });

  const load = async () => {
    const [l, c] = await Promise.all([
      fetch("/api/links").then((r) => r.json()),
      fetch("/api/credentials").then((r) => r.json()),
    ]);
    setLinks(l);
    setCreds(c);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!sp.get("tab")) router.replace("/links?tab=links");
  }, [router, sp]);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[#9e1b1f]">روابط ويوزرات</h2>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/links?tab=links")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "links" ? "bg-[#9e1b1f] text-white" : "bg-slate-100"}`}
        >
          روابط
        </button>
        <button
          type="button"
          onClick={() => router.push("/links?tab=creds")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "creds" ? "bg-[#9e1b1f] text-white" : "bg-slate-100"}`}
        >
          يوزرات
        </button>
      </div>

      {tab === "links" ? (
        <div className="space-y-3">
          {links.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm">
              <span className="font-semibold">{row.system}</span>
              <a className="text-[#ef7d00] underline" href={row.url} target="_blank" rel="noreferrer">
                فتح
              </a>
              <button type="button" className="rounded bg-slate-100 px-2 py-1" onClick={() => clip(row.url)}>
                نسخ الرابط
              </button>
              {isAdmin ? (
                <button
                  type="button"
                  className="mr-auto text-red-600"
                  onClick={async () => {
                    await fetch(`/api/links/${row.id}`, { method: "DELETE" });
                    load();
                  }}
                >
                  حذف
                </button>
              ) : null}
            </div>
          ))}
          {isAdmin ? (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <input
                className="input max-w-xs"
                placeholder="اسم المنظومة"
                value={newLink.system}
                onChange={(e) => setNewLink((s) => ({ ...s, system: e.target.value }))}
              />
              <input
                className="input max-w-md flex-1"
                placeholder="الرابط"
                value={newLink.url}
                onChange={(e) => setNewLink((s) => ({ ...s, url: e.target.value }))}
              />
              <button
                type="button"
                className="rounded-lg bg-[#9e1b1f] px-3 py-2 text-white"
                onClick={async () => {
                  await fetch("/api/links", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newLink),
                  });
                  setNewLink({ system: "", url: "" });
                  load();
                }}
              >
                إضافة
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {creds.map((row) => (
            <CredEditor key={row.id} row={row} isAdmin={isAdmin} onSaved={load} />
          ))}
          {isAdmin ? (
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <input
                className="input max-w-xs"
                placeholder="منظومة"
                value={newCred.system}
                onChange={(e) => setNewCred((s) => ({ ...s, system: e.target.value }))}
              />
              <input
                className="input max-w-xs"
                placeholder="مستخدم"
                value={newCred.username}
                onChange={(e) => setNewCred((s) => ({ ...s, username: e.target.value }))}
              />
              <input
                className="input max-w-xs"
                placeholder="كلمة المرور"
                value={newCred.password}
                onChange={(e) => setNewCred((s) => ({ ...s, password: e.target.value }))}
              />
              <button
                type="button"
                className="rounded-lg bg-[#9e1b1f] px-3 py-2 text-white"
                onClick={async () => {
                  await fetch("/api/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newCred),
                  });
                  setNewCred({ system: "", username: "", password: "" });
                  load();
                }}
              >
                إضافة
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function CredEditor({
  row,
  isAdmin,
  onSaved,
}: {
  row: CredRow;
  isAdmin: boolean;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(row.username);
  const [password, setPassword] = useState(row.password);

  const save = async () => {
    await fetch(`/api/credentials/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    onSaved();
  };

  return (
    <div className="rounded-lg border border-slate-200 p-3 text-sm">
      <p className="mb-2 font-semibold">{row.system}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-slate-600">
          اسم المستخدم
          <input className="input mt-1" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="text-slate-600">
          كلمة المرور
          <input
            className="input mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="rounded bg-slate-100 px-2 py-1" onClick={() => clip(username)}>
          نسخ المستخدم
        </button>
        <button type="button" className="rounded bg-slate-100 px-2 py-1" onClick={() => clip(password)}>
          نسخ كلمة المرور
        </button>
        <button type="button" className="rounded-lg bg-[#ef7d00] px-3 py-1 text-white" onClick={save}>
          حفظ
        </button>
        {isAdmin ? (
          <button
            type="button"
            className="text-red-600"
            onClick={async () => {
              await fetch(`/api/credentials/${row.id}`, { method: "DELETE" });
              onSaved();
            }}
          >
            حذف
          </button>
        ) : null}
      </div>
    </div>
  );
}

function clip(t: string) {
  void navigator.clipboard.writeText(t);
}
