"use client";

import { useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { Link2, Pencil, Plus, Trash2 } from "lucide-react";

type LinkRow = { id: string; system: string; url: string };
type PrivateLinkRow = { id: string; label: string; url: string };

export default function LinksPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl bg-white p-8 text-center text-slate-500">جاري التحميل…</div>}>
      <LinksInner />
    </Suspense>
  );
}

function LinksInner() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [links, setLinks] = useState<LinkRow[]>([]);
  const [privateLinks, setPrivateLinks] = useState<PrivateLinkRow[]>([]);
  const [newLink, setNewLink] = useState({ system: "", url: "" });
  const [newPrivateLink, setNewPrivateLink] = useState({ label: "", url: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", url: "" });
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    const linksData = await fetch("/api/links").then((r) => r.json());
    setLinks(linksData.shared ?? []);
    setPrivateLinks(linksData.private ?? []);
  };

  useEffect(() => {
    void (async () => {
      const linksData = await fetch("/api/links").then((r) => r.json());
      setLinks(linksData.shared ?? []);
      setPrivateLinks(linksData.private ?? []);
    })();
  }, []);

  return (
    <section className="chat-pane relative">
      {copied ? (
        <div className="absolute left-4 top-4 rounded-md bg-emerald-600 px-3 py-1 text-xs text-white shadow">
          Copied!
        </div>
      ) : null}
      <h2 className="mb-5 text-2xl font-bold text-[#E60000]">الروابط</h2>
      <div className="space-y-3">
          {links.map((row) => (
            <div key={row.id} className="group rounded-2xl border border-[#9e1b1f]/20 bg-white/90 p-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{row.system}</span>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded p-1 text-slate-700 admin-hover-action"
                      onClick={() => {
                        setEditingId(row.id);
                        setEditDraft({ name: row.system, url: row.url });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-red-700 admin-hover-action"
                      onClick={async () => {
                        await fetch(`/api/links/${row.id}`, { method: "DELETE" });
                        load();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
              <a className="text-[#E60000] underline" href={row.url} target="_blank" rel="noreferrer">
                فتح
              </a>
              <button type="button" className="mr-2 rounded bg-slate-100 px-2 py-1" onClick={() => clip(row.url, setCopied)}>
                نسخ الرابط
              </button>
            </div>
          ))}
          <div className="rounded-2xl border border-[#9e1b1f]/20 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">روابطي الخاصة</p>
            <div className="space-y-2">
              {privateLinks.map((row) => (
                <div key={row.id} className="group flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm transition-all duration-300 ease-out hover:bg-[#E60000]/5">
                  <Link2 className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">{row.label}</span>
                  <a className="text-[#E60000] underline" href={row.url} target="_blank" rel="noreferrer">
                    فتح
                  </a>
                  <button type="button" className="rounded bg-white px-2 py-1" onClick={() => clip(row.url, setCopied)}>
                    نسخ
                  </button>
                  <button
                    type="button"
                    className="mr-auto text-red-600 admin-hover-action"
                    onClick={async () => {
                      await fetch(`/api/links/${row.id}`, { method: "DELETE" });
                      load();
                    }}
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              <input
                className="input max-w-xs"
                placeholder="اسم الرابط الخاص"
                value={newPrivateLink.label}
                onChange={(e) => setNewPrivateLink((s) => ({ ...s, label: e.target.value }))}
              />
              <input
                className="input max-w-md flex-1"
                placeholder="الرابط"
                value={newPrivateLink.url}
                onChange={(e) => setNewPrivateLink((s) => ({ ...s, url: e.target.value }))}
              />
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-xl bg-[#E60000] px-3 py-2 text-white"
                onClick={async () => {
                  await fetch("/api/links", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...newPrivateLink, isPrivate: true }),
                  });
                  setNewPrivateLink({ label: "", url: "" });
                  load();
                }}
              >
                <Plus className="h-4 w-4" /> إضافة
              </button>
            </div>
          </div>
          {isAdmin ? <div className="flex flex-wrap gap-2 border-t pt-3">
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
                className="rounded-xl bg-[#9e1b1f] px-3 py-2 text-white"
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
            </div> : null}
      </div>
      {editingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-card w-full max-w-md bg-white p-4">
            <h3 className="mb-2 font-semibold">تعديل الرابط</h3>
            <input className="input mb-2" value={editDraft.name} onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))} />
            <input className="input mb-3" value={editDraft.url} onChange={(e) => setEditDraft((s) => ({ ...s, url: e.target.value }))} />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl bg-[#9e1b1f] px-3 py-2 text-white"
                onClick={async () => {
                  await fetch(`/api/links/${editingId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ system: editDraft.name, label: editDraft.name, url: editDraft.url }),
                  });
                  setEditingId(null);
                  load();
                }}
              >
                حفظ
              </button>
              <button type="button" className="rounded-xl bg-slate-200 px-3 py-2" onClick={() => setEditingId(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function clip(t: string, setCopied?: (value: string | null) => void) {
  void navigator.clipboard.writeText(t);
  if (setCopied) {
    setCopied("Copied!");
    window.setTimeout(() => setCopied(null), 1200);
  }
}
