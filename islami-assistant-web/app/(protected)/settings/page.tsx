"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { getAvatarEmoji, getAvatarImageUrl } from "@/lib/avatar";

type UserRow = { id: string; name: string; username: string; role: string };
const PRESET_AVATARS = [
  "👨",
  "👨‍💼",
  "👨‍💻",
  "🧔",
  "🧔‍♂️",
  "👴",
  "👨‍🦳",
  "👨‍🦱",
  "👨‍🦰",
  "👨‍🦲",
  "👩",
  "👩‍💼",
  "👩‍💻",
  "👩‍🦱",
  "👩‍🦰",
  "👩‍🦳",
  "🧕",
  "👵",
  "🧑",
  "🧑‍💼",
  "🧑‍💻",
  "🧑‍🦱",
  "🧑‍🦳",
  "🧑‍🦰",
  "🧑‍🦲",
  "🧑‍🏫",
  "🧑‍⚕️",
  "👮",
];

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", password: "" });
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "EMPLOYEE" as "EMPLOYEE" | "ADMIN" });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [knownPasswords, setKnownPasswords] = useState<Record<string, string>>({});
  const [importToast, setImportToast] = useState<{ message: string; tone: "success" | "warning" } | null>(null);
  const [profileToast, setProfileToast] = useState<{ message: string; tone: "success" | "warning" } | null>(null);
  const [avatarPreviewFailed, setAvatarPreviewFailed] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        setName(me.name ?? session?.user?.name ?? "");
        setAvatarUrl(me.avatarUrl ?? "");
      })
      .catch(() => {
        if (session?.user?.name) setName(session.user.name);
      });
  }, [session?.user?.name]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers);
  }, [isAdmin]);

  useEffect(() => {
    if (!importToast) return;
    const id = window.setTimeout(() => setImportToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [importToast]);

  useEffect(() => {
    if (!profileToast) return;
    const id = window.setTimeout(() => setProfileToast(null), 2500);
    return () => window.clearTimeout(id);
  }, [profileToast]);

  useEffect(() => {
    setAvatarPreviewFailed(false);
  }, [avatarUrl]);

  const syncAvatarInClient = async () => {
    await update({});
    window.localStorage.setItem("profile-avatar-updated-at", String(Date.now()));
    window.dispatchEvent(new Event("profile-avatar-updated"));
  };

  const setAvatarAndPersist = async (nextAvatar: string | null) => {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: nextAvatar }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setProfileToast({ tone: "warning", message: data.error ?? "تعذر حفظ الشخصية المختارة." });
      return false;
    }
    setAvatarUrl(nextAvatar ?? "");
    await syncAvatarInClient();
    return true;
  };

  const saveProfile = async () => {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        avatarUrl: avatarUrl || null,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      }),
    });
    if (!res.ok) {
      alert((await res.json()).error ?? "خطأ");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    await update({});
    await syncAvatarInClient();
    setProfileToast({ tone: "success", message: "تم حفظ التغييرات بنجاح." });
  };

  const resetAvatar = async () => {
    const ok = await setAvatarAndPersist(null);
    if (!ok) {
      return;
    }
    setProfileToast({ tone: "success", message: "تمت إعادة الصورة للوضع الافتراضي." });
  };

  return (
    <div className="space-y-6">
      <section className="chat-pane">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-[#9e1b1f]">⚙ الإعدادات</h2>
        <div className="grid max-w-lg gap-3 text-sm">
          {profileToast ? (
            <div
              className={`rounded-xl px-3 py-2 text-sm ${
                profileToast.tone === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {profileToast.message}
            </div>
          ) : null}
          <div className="text-slate-600">
            <p className="mb-2 text-sm font-semibold">اختر شخصيتك</p>
            <div className="grid grid-cols-6 gap-2 rounded-2xl border border-slate-200 bg-white p-3">
              {PRESET_AVATARS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={async () => {
                    const ok = await setAvatarAndPersist(emoji);
                    if (ok) {
                      setProfileToast({ tone: "success", message: "تم حفظ الشخصية المختارة بنجاح." });
                    }
                  }}
                  className={`rounded-xl border px-2 py-1.5 text-2xl transition hover:scale-105 ${
                    avatarUrl === emoji ? "border-[#E60000] bg-[#fff1f1]" : "border-slate-200 bg-white"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold">الصورة الشخصية الحالية</p>
              <button
                type="button"
                onClick={resetAvatar}
                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
              >
                Reset to Default
              </button>
            </div>
            {getAvatarImageUrl(avatarUrl) && !avatarPreviewFailed ? (
              <img
                src={getAvatarImageUrl(avatarUrl) ?? ""}
                alt="Current avatar"
                className="h-16 w-16 rounded-full border object-cover"
                onError={() => setAvatarPreviewFailed(true)}
              />
            ) : getAvatarEmoji(avatarUrl) ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-white text-4xl">
                {getAvatarEmoji(avatarUrl)}
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#9e1b1f] text-xl font-bold text-white">
                {(name || session?.user?.name || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <label className="text-slate-600">
            الاسم
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-slate-600">
            كلمة المرور الحالية (عند التغيير)
            <input
              type="password"
              className="input mt-1"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label className="text-slate-600">
            كلمة المرور الجديدة
            <input
              type="password"
              className="input mt-1"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <button type="button" className="rounded-xl bg-[#E60000] px-4 py-2 text-white" onClick={saveProfile}>
            حفظ التغييرات
          </button>
        </div>
      </section>

      {isAdmin ? (
        <section id="employees" className="chat-pane">
          <h2 className="mb-3 text-xl font-bold text-[#9e1b1f]">إدارة الموظفين</h2>
          {importToast ? (
            <div
              className={`mb-3 rounded-xl px-3 py-2 text-sm ${
                importToast.tone === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {importToast.message}
            </div>
          ) : null}
          <div className="mb-4 rounded-2xl border border-dashed border-[#E60000]/30 p-3">
            <p className="mb-2 text-sm font-semibold">إضافة مستخدم جديد</p>
            <div className="flex flex-wrap gap-2">
              <input
                className="input max-w-xs"
                placeholder="الاسم"
                value={newUser.name}
                onChange={(e) => setNewUser((s) => ({ ...s, name: e.target.value }))}
              />
              <input
                className="input max-w-xs"
                placeholder="اسم المستخدم"
                value={newUser.username}
                onChange={(e) => setNewUser((s) => ({ ...s, username: e.target.value }))}
              />
              <input
                className="input max-w-xs"
                placeholder="كلمة المرور"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))}
              />
              <select
                className="input max-w-xs"
                value={newUser.role}
                onChange={(e) => setNewUser((s) => ({ ...s, role: e.target.value as "ADMIN" | "EMPLOYEE" }))}
              >
                <option value="EMPLOYEE">موظف</option>
                <option value="ADMIN">مسؤول</option>
              </select>
              <button
                type="button"
                className="rounded-xl bg-[#9e1b1f] px-3 py-2 text-white"
                onClick={async () => {
                  const pendingPassword = newUser.password;
                  const res = await fetch("/api/admin/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newUser),
                  });
                  if (!res.ok) {
                    alert("تعذر الإنشاء");
                    return;
                  }
                  const u = await res.json();
                  setUsers((list) => [u, ...list]);
                  setKnownPasswords((s) => ({ ...s, [u.id]: pendingPassword }));
                  setNewUser({ name: "", username: "", password: "", role: "EMPLOYEE" });
                }}
              >
                إضافة موظف
              </button>
            </div>
          </div>
          <form
            className="mb-4 rounded-lg border border-dashed border-slate-300 p-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const file = fd.get("file");
              if (!(file instanceof File) || file.size === 0) return;
              const res = await fetch("/api/admin/import/staff", { method: "POST", body: fd });
              const data = await res.json();
              if (!res.ok) {
                alert(data.error ?? "فشل الاستيراد");
                return;
              }
              const imported = Number(data.imported ?? 0);
              const skipped = Number(data.skipped ?? 0);
              setImportToast({
                tone: skipped > 0 ? "warning" : "success",
                message: `تم استيراد (${imported}) مستخدم بنجاح. تم تخطي (${skipped}) سجلات بسبب نقص البيانات أو التكرار.`,
              });
              const usersRes = await fetch("/api/admin/users");
              setUsers(await usersRes.json());
            }}
          >
            <p className="mb-2 text-sm font-semibold">استيراد الموظفين من Excel</p>
            <div className="flex flex-wrap items-center gap-2">
              <input type="file" name="file" accept=".xlsx,.xls" className="text-sm" />
              <button type="submit" className="rounded-xl bg-[#9e1b1f] px-3 py-2 text-white">
                استيراد الملف
              </button>
            </div>
          </form>
          <input
            className="input mb-3 max-w-md"
            placeholder="بحث باسم الموظف أو اليوزر"
            value={employeeQuery}
            onChange={(e) => setEmployeeQuery(e.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {users
              .filter((u) => {
                const q = employeeQuery.trim().toLowerCase();
                if (!q) return true;
                return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
              })
              .map((u) => (
                <article key={u.id} className="flex min-h-[170px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-center text-base font-semibold text-slate-800">{u.name}</h3>
                  <div className="mt-2 text-center text-sm text-slate-600">
                    <p>المستخدم: {u.username}</p>
                    <p className="mt-1">
                      كلمة المرور:{" "}
                      {showPasswords[u.id] ? (knownPasswords[u.id] || "غير متاح") : "••••••••"}
                      <button
                        type="button"
                        className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs"
                        onClick={() => setShowPasswords((s) => ({ ...s, [u.id]: !s[u.id] }))}
                      >
                        {showPasswords[u.id] ? "إخفاء" : "إظهار"}
                      </button>
                    </p>
                  </div>
                  <div className="mt-auto border-t pt-3">
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        className="rounded p-1.5 text-slate-700 hover:bg-slate-100"
                        onClick={() => {
                          setEditingUserId(u.id);
                          setEditDraft({ name: u.name, password: "" });
                        }}
                        title="تعديل"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (!confirm("حذف المستخدم؟")) return;
                          await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
                          setUsers((list) => list.filter((x) => x.id !== u.id));
                        }}
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ) : null}
      {editingUserId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass-card w-full max-w-md bg-white p-4">
            <h3 className="mb-2 font-semibold">تعديل المستخدم</h3>
            <input className="input mb-2" value={editDraft.name} onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))} />
            <input type="password" className="input mb-3" placeholder="كلمة مرور جديدة (اختياري)" value={editDraft.password} onChange={(e) => setEditDraft((s) => ({ ...s, password: e.target.value }))} />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl bg-[#9e1b1f] px-3 py-2 text-white"
                onClick={async () => {
                  const res = await fetch(`/api/admin/users/${editingUserId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: editDraft.name, password: editDraft.password || undefined }),
                  });
                  if (!res.ok) return alert("تعذر حفظ التعديل");
                  const updated = await res.json();
                  setUsers((list) => list.map((x) => (x.id === editingUserId ? updated : x)));
                  if (editDraft.password) {
                    setKnownPasswords((s) => ({ ...s, [editingUserId]: editDraft.password }));
                  }
                  setEditingUserId(null);
                  setEditDraft({ name: "", password: "" });
                }}
              >
                حفظ
              </button>
              <button type="button" className="rounded-xl bg-slate-200 px-3 py-2" onClick={() => setEditingUserId(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
