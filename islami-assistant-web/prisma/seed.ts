import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import path from "node:path";
import * as XLSX from "xlsx";

function val(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const raw = row[key];
    if (raw != null && String(raw).trim()) return String(raw).trim();
  }
  return "";
}

async function main() {
  // Temporary deployment fix:
  // Clear old finance rates so the new unique index on
  // (financeType, salaryType, startYear, endYear) can be created safely.
  await prisma.financeRate.deleteMany({});

  const passwordHash = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      name: "Admin",
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Admin",
      username: "admin",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const staffPath = path.join(process.cwd(), "public", "data", "اسماء الموظفين وكلمات السر .xlsx");
  try {
    const workbook = XLSX.readFile(staffPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    for (const row of rows) {
      const name = val(row, "Employee Name", "employee name", "الاسم", "اسم الموظف");
      const username = val(row, "Email/Username", "email/username", "username", "اسم المستخدم", "البريد");
      const password = val(row, "Password", "password", "كلمة المرور");
      const roleRaw = val(row, "Role", "role", "الدور", "الصلاحية").toUpperCase();
      if (!name || !username || !password) continue;
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.upsert({
        where: { username },
        update: {
          name,
          passwordHash,
          role: roleRaw === "ADMIN" ? UserRole.ADMIN : UserRole.EMPLOYEE,
        },
        create: {
          name,
          username,
          passwordHash,
          role: roleRaw === "ADMIN" ? UserRole.ADMIN : UserRole.EMPLOYEE,
        },
      });
    }
  } catch {
    // Staff seed file is optional in some environments.
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
