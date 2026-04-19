import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const data = rows
    .map((r) => ({
      financeType: String(r["نوع التمويل"] ?? r["financeType"] ?? ""),
      salaryType: String(r["نوع الراتب"] ?? r["salaryType"] ?? ""),
      years: Number(r["عدد السنوات"] ?? r["years"] ?? 0),
      rate: Number(r["النسبة"] ?? r["rate"] ?? 0),
    }))
    .filter((r) => r.financeType && r.salaryType && r.years > 0);

  await prisma.financeRate.deleteMany();
  if (data.length) await prisma.financeRate.createMany({ data });
  return NextResponse.json({ imported: data.length });
}
