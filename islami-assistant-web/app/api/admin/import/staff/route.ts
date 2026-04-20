import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

function val(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const raw = row[key];
    if (raw != null && String(raw).trim()) return String(raw).trim();
  }
  return "";
}

function toRole(value: string): UserRole {
  const normalized = value.trim().toUpperCase();
  return normalized === "ADMIN" ? UserRole.ADMIN : UserRole.EMPLOYEE;
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  let imported = 0;

  for (const row of rows) {
    const name = val(row, "Employee Name", "employee name", "الاسم", "اسم الموظف");
    const username = val(row, "Email/Username", "email/username", "username", "اسم المستخدم", "البريد");
    const password = val(row, "Password", "password", "كلمة المرور");
    const roleRaw = val(row, "Role", "role", "الدور", "الصلاحية");
    if (!name || !username || !password) continue;

    const passwordHash = await bcrypt.hash(password, 10);
    const role = toRole(roleRaw);
    await prisma.user.upsert({
      where: { username },
      update: { name, passwordHash, role },
      create: { name, username, passwordHash, role },
    });
    imported += 1;
  }

  return NextResponse.json({ imported });
}
