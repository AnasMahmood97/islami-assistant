import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const rows = await prisma.approvedCompany.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(rows);
}

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

  const data = rows.map((r) => ({
    name: String(r["اسم الشركة"] ?? r["name"] ?? ""),
    notes: String(r["ملاحظات"] ?? r["notes"] ?? ""),
    city: String(r["المدينة"] ?? r["city"] ?? ""),
    phone: String(r["الهاتف"] ?? r["phone"] ?? ""),
  })).filter((r) => r.name);

  await prisma.approvedCompany.deleteMany();
  if (data.length) await prisma.approvedCompany.createMany({ data });
  return NextResponse.json({ imported: data.length });
}
