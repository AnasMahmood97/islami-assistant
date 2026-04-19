import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const rows = await prisma.branchAtmEntry.findMany({
    where: {
      type,
      ...(q ? { name: { contains: q } } : {}),
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type } = await params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const data = rows
    .map((r) => ({
      type,
      name: String(r["الاسم"] ?? r["name"] ?? r["الفرع"] ?? ""),
      city: String(r["المدينة"] ?? r["city"] ?? ""),
      address: String(r["العنوان"] ?? r["address"] ?? ""),
      phone: String(r["الهاتف"] ?? r["phone"] ?? ""),
      notes: String(r["ملاحظات"] ?? r["notes"] ?? ""),
    }))
    .filter((r) => r.name);

  await prisma.branchAtmEntry.deleteMany({ where: { type } });
  if (data.length) await prisma.branchAtmEntry.createMany({ data });
  return NextResponse.json({ imported: data.length });
}
