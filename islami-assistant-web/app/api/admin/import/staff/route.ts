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

function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[String(key).trim()] = value;
  }
  return normalized;
}

function toRole(value: string): UserRole {
  const normalized = value.trim();
  const upper = normalized.toUpperCase();
  if (upper.includes("ADMIN") || normalized.includes("ادمن") || normalized.includes("أدمن")) {
    return UserRole.ADMIN;
  }
  return UserRole.EMPLOYEE;
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
  let skipped = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = normalizeRowKeys(rows[index]);
    const name = val(row, "الاسم", "اسم الموظف", "Employee Name", "employee name");
    const username = val(row, "اسم المستخدم", "username", "Email/Username", "email/username", "البريد");
    const password = val(row, "كلمة المرور", "Password", "password");
    const roleRaw = val(row, "صلاحيات", "Role", "role", "الدور", "الصلاحية");
    if (!name || !username || !password) {
      console.log("[staff-import] skipped row", index + 2, {
        reason: "missing required fields",
        hasName: Boolean(name),
        hasUsername: Boolean(username),
        hasPassword: Boolean(password),
      });
      skipped += 1;
      continue;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = toRole(roleRaw);
    await prisma.user.upsert({
      where: { username },
      update: { name, passwordHash, role },
      create: { name, username, passwordHash, role },
    });
    imported += 1;
  }

  return NextResponse.json({ success: true, imported, skipped });
}
