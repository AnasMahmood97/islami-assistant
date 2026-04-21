"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type UserRow = { id: string; name: string; username: string; role: string };

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", password: "" });
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "EMPLOYEE" as "EMPLOYEE" | "ADMIN" });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        setName(me.name ?? session?.user?.name ?? "");
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
      <section className="chat-pane">
        <h2 className="mb-3 text-xl font-bold text-[#b65600]">الإعدادات</h2>
        <div className="grid max-w-lg gap-3 text-sm">
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
          <button type="button" className="rounded-xl bg-[#FF7F00] px-4 py-2 text-white" onClick={saveProfile}>
            حفظ التغييرات
          </button>
        </div>
      </section>

      {isAdmin ? (
        <section id="employees" className="chat-pane">
          <h2 className="mb-3 text-xl font-bold text-[#b65600]">إدارة الموظفين</h2>
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
              <button type="submit" className="rounded-xl bg-[#FF7F00] px-3 py-2 text-white">
                استيراد الملف
              </button>
              <button
                type="button"
                className="rounded-xl bg-orange-100 px-3 py-2 text-sm text-[#b65600]"
                onClick={async () => {
                  const fileRes = await fetch("/data/%D8%A7%D8%B3%D9%85%D8%A7%D8%A1%20%D8%A7%D9%84%D9%85%D9%88%D8%B8%D9%81%D9%8A%D9%86%20%D9%88%D9%83%D9%84%D9%85%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B3%D8%B1%20.xlsx");
                  if (!fileRes.ok) return alert("لم يتم العثور على الملف الافتراضي.");
                  const blob = await fileRes.blob();
                  const fd = new FormData();
                  fd.append("file", new File([blob], "staff.xlsx"));
                  const res = await fetch("/api/admin/import/staff", { method: "POST", body: fd });
                  const data = await res.json();
                  if (!res.ok) return alert(data.error ?? "فشل الاستيراد");
                  alert(`تم استيراد/تحديث ${data.imported ?? 0} مستخدم`);
                  const usersRes = await fetch("/api/admin/users");
                  setUsers(await usersRes.json());
                }}
              >
                استيراد الملف الافتراضي
              </button>
            </div>
          </form>
          <input
            className="input mb-3 max-w-md"
            placeholder="بحث باسم الموظف أو اليوزر"
            value={employeeQuery}
            onChange={(e) => setEmployeeQuery(e.target.value)}
          />
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
                {users
                  .filter((u) => {
                    const q = employeeQuery.trim().toLowerCase();
                    if (!q) return true;
                    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                  })
                  .map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-2">
                      {editingUserId === u.id ? (
                        <input className="input max-w-xs" value={editDraft.name} onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))} />
                      ) : (
                        u.name
                      )}
                    </td>
                    <td className="p-2">{u.username}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2">
                      <div className="flex gap-3">
                        {editingUserId === u.id ? (
                          <>
                            <input type="password" className="input max-w-xs" placeholder="كلمة مرور جديدة (اختياري)" value={editDraft.password} onChange={(e) => setEditDraft((s) => ({ ...s, password: e.target.value }))} />
                            <button
                              type="button"
                              className="text-emerald-700"
                              onClick={async () => {
                                const res = await fetch(`/api/admin/users/${u.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ name: editDraft.name, password: editDraft.password || undefined }),
                                });
                                if (!res.ok) return alert("تعذر حفظ التعديل");
                                const updated = await res.json();
                                setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
                                setEditingUserId(null);
                                setEditDraft({ name: "", password: "" });
                              }}
                            >
                              حفظ
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="text-slate-700"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditDraft({ name: u.name, password: "" });
                            }}
                          >
                            تعديل
                          </button>
                        )}
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
                      </div>
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
              className="rounded-xl bg-[#FF7F00] px-3 py-2 text-white"
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
