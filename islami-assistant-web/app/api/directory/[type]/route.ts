import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function norm(value: unknown): string {
  return clean(value).replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/\s+/g, "");
}

function findIdx(headers: string[], aliases: string[]): number {
  const hs = headers.map((h) => norm(h));
  const as = aliases.map((a) => norm(a));
  for (let i = 0; i < hs.length; i += 1) {
    const h = hs[i];
    if (!h) continue;
    if (as.some((a) => h === a || h.includes(a) || a.includes(h))) return i;
  }
  return -1;
}

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
  const rows2d = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  let headerRow = 0;
  for (let i = 0; i < rows2d.length; i += 1) {
    const row = (rows2d[i] ?? []).map(clean);
    if (findIdx(row, ["الاسم", "الفرع", "اسم الفرع", "name", "الموقع"]) >= 0) {
      headerRow = i;
      break;
    }
  }
  const headers = (rows2d[headerRow] ?? []).map(clean);
  const nameIdx = findIdx(headers, ["الاسم", "الفرع", "اسم الفرع", "name", "الموقع"]);
  const cityIdx = findIdx(headers, ["المدينة", "المحافظة", "city"]);
  const addressIdx = findIdx(headers, ["العنوان", "address", "الموقع"]);
  const phoneIdx = findIdx(headers, ["الهاتف", "phone", "رقم الهاتف", "تلفون"]);
  const notesIdx = findIdx(headers, ["ملاحظات", "notes", "ملاحظة"]);

  if (nameIdx < 0) return NextResponse.json({ error: "Header name column not found" }, { status: 400 });

  const data = rows2d
    .slice(headerRow + 1)
    .map((r) => {
      const row = Array.isArray(r) ? r : [];
      return {
      type,
      name: clean(row[nameIdx]),
      city: cityIdx >= 0 ? clean(row[cityIdx]) : "",
      address: addressIdx >= 0 ? clean(row[addressIdx]) : "",
      phone: phoneIdx >= 0 ? clean(row[phoneIdx]) : "",
      notes: notesIdx >= 0 ? clean(row[notesIdx]) : "",
    };
    })
    .filter((r) => r.name);

  await prisma.branchAtmEntry.deleteMany({ where: { type } });
  if (data.length) await prisma.branchAtmEntry.createMany({ data });
  return NextResponse.json({ imported: data.length });
}
