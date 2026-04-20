"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type UserRow = { id: string; name: string; username: string; role: string };

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("ar");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "EMPLOYEE" as "EMPLOYEE" | "ADMIN" });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        setName(me.name ?? session?.user?.name ?? "");
        setAvatarUrl(me.avatarUrl ?? "");
        setTheme(me.theme ?? "light");
        setLanguage(me.language ?? "ar");
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

  const saveProfile = async () => {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        avatarUrl: avatarUrl || null,
        theme,
        language,
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
    alert("تم الحفظ.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-xl font-bold text-[#9e1b1f]">إعداداتي</h2>
        <div className="grid max-w-lg gap-3 text-sm">
          <label className="text-slate-600">
            الاسم
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-slate-600">
            صورة الملف الشخصي
            <input
              className="input mt-1"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/uploads", { method: "POST", body: fd });
                if (!res.ok) {
                  alert("فشل رفع الصورة");
                  return;
                }
                const data = await res.json();
                setAvatarUrl(data.url);
              }}
            />
            {avatarUrl ? <img src={avatarUrl} alt="avatar" className="mt-2 h-16 w-16 rounded-full object-cover" /> : null}
          </label>
          <label className="text-slate-600">
            الثيم
            <select className="input mt-1" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">فاتح</option>
              <option value="dark">داكن</option>
            </select>
          </label>
          <label className="text-slate-600">
            اللغة
            <select className="input mt-1" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
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
          <button type="button" className="rounded-lg bg-[#9e1b1f] px-4 py-2 text-white" onClick={saveProfile}>
            حفظ التغييرات
          </button>
        </div>
      </section>

      {isAdmin ? (
        <section id="employees" className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-bold text-[#9e1b1f]">إدارة الموظفين</h2>
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
              alert(`تم استيراد/تحديث ${data.imported ?? 0} مستخدم`);
              const usersRes = await fetch("/api/admin/users");
              setUsers(await usersRes.json());
            }}
          >
            <p className="mb-2 text-sm font-semibold">استيراد الموظفين من Excel</p>
            <div className="flex flex-wrap items-center gap-2">
              <input type="file" name="file" accept=".xlsx,.xls" className="text-sm" />
              <button type="submit" className="rounded-lg bg-[#ef7d00] px-3 py-2 text-white">
                استيراد الملف
              </button>
            </div>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b text-right">
                  <th className="p-2">الاسم</th>
                  <th className="p-2">المستخدم</th>
                  <th className="p-2">الدور</th>
                  <th className="p-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.username}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={async () => {
                          if (!confirm("حذف المستخدم؟")) return;
                          await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
                          setUsers((list) => list.filter((x) => x.id !== u.id));
                        }}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
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
              className="rounded-lg bg-[#9e1b1f] px-3 py-2 text-white"
              onClick={async () => {
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
                setUsers((list) => [...list, u]);
                setNewUser({ name: "", username: "", password: "", role: "EMPLOYEE" });
              }}
            >
              إضافة موظف
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
