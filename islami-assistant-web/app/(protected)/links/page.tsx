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
  const [editingPrivate, setEditingPrivate] = useState(false);
  const [editDraft, setEditDraft] = useState({ name: "", url: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const q = searchQuery.trim().toLowerCase();
  const filteredShared = links.filter((row) => !q || row.system.toLowerCase().includes(q) || row.url.toLowerCase().includes(q));
  const filteredPrivate = privateLinks.filter((row) => !q || row.label.toLowerCase().includes(q) || row.url.toLowerCase().includes(q));

  return (
    <section className="chat-pane relative">
      {copied ? (
        <div className="absolute left-4 top-4 rounded-md bg-emerald-600 px-3 py-1 text-xs text-white shadow">
          Copied!
        </div>
      ) : null}
      <h2 className="mb-5 text-2xl font-bold text-[#E60000]">الروابط</h2>
      <div className="space-y-4">
        <div className="rounded-2xl border border-dashed border-[#E60000]/30 bg-white p-3">
          {isAdmin ? (
            <div className="mb-3 flex flex-wrap gap-2 border-b pb-3">
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
                  const res = await fetch("/api/links", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newLink),
                  });
                  if (res.ok) {
                    const created = await res.json();
                    setLinks((prev) => [created, ...prev]);
                  }
                  setNewLink({ system: "", url: "" });
                }}
              >
                إضافة رابط عام
              </button>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
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
                const res = await fetch("/api/links", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...newPrivateLink, isPrivate: true }),
                });
                if (res.ok) {
                  const created = await res.json();
                  setPrivateLinks((prev) => [created, ...prev]);
                }
                setNewPrivateLink({ label: "", url: "" });
              }}
            >
              <Plus className="h-4 w-4" /> إضافة رابط خاص
            </button>
          </div>
        </div>
        <input
          className="input w-full md:max-w-lg"
          placeholder="بحث فوري باسم المنظومة أو الرابط"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredShared.map((row) => (
            <article key={row.id} className="flex min-h-[180px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-center text-base font-semibold text-slate-800">{row.system}</h3>
              <p className="mt-2 line-clamp-2 break-all text-center text-sm text-slate-600">{row.url}</p>
              <div className="mt-auto border-t pt-3">
                <div className="mb-2 flex justify-center gap-2">
                  <a className="rounded-lg bg-[#E60000] px-3 py-1.5 text-xs text-white" href={row.url} target="_blank" rel="noreferrer">فتح</a>
                  <button type="button" className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs" onClick={() => clip(row.url, setCopied)}>نسخ</button>
                </div>
                {isAdmin ? (
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      className="rounded p-1.5 text-slate-700 hover:bg-slate-100"
                      onClick={() => {
                        setEditingId(row.id);
                        setEditingPrivate(false);
                        setEditDraft({ name: row.system, url: row.url });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1.5 text-red-700 hover:bg-red-50"
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
            </article>
          ))}
          {filteredPrivate.map((row) => (
            <article key={row.id} className="flex min-h-[180px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex justify-center">
                <Link2 className="h-4 w-4 text-slate-400" />
              </div>
              <h3 className="text-center text-base font-semibold text-slate-800">{row.label}</h3>
              <p className="mt-2 line-clamp-2 break-all text-center text-sm text-slate-600">{row.url}</p>
              <div className="mt-auto border-t pt-3">
                <div className="mb-2 flex justify-center gap-2">
                  <a className="rounded-lg bg-[#E60000] px-3 py-1.5 text-xs text-white" href={row.url} target="_blank" rel="noreferrer">فتح</a>
                  <button type="button" className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs" onClick={() => clip(row.url, setCopied)}>نسخ</button>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    className="rounded p-1.5 text-slate-700 hover:bg-slate-100"
                    onClick={() => {
                      setEditingId(row.id);
                      setEditingPrivate(true);
                      setEditDraft({ name: row.label, url: row.url });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1.5 text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      await fetch(`/api/links/${row.id}`, { method: "DELETE" });
                      load();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
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
                    body: JSON.stringify({ system: editDraft.name, label: editDraft.name, url: editDraft.url, isPrivate: editingPrivate }),
                  });
                  setEditingId(null);
                  setEditingPrivate(false);
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
