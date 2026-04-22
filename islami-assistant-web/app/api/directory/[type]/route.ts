import { auth } from "@/auth";
import { cleanCell, findHeaderIndex, sheetTo2dRows } from "@/lib/excel-utils";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const keywords = q
    .trim()
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const rows = await prisma.branchAtmEntry.findMany({
    where: {
      type,
      ...(keywords.length
        ? {
            AND: keywords.map((kw) => ({
              OR:
                type === "branches"
                  ? [
                      { name: { contains: kw, mode: "insensitive" } },
                      { address: { contains: kw, mode: "insensitive" } },
                      { phone: { contains: kw, mode: "insensitive" } },
                      { postalCode: { contains: kw, mode: "insensitive" } },
                    ]
                  : [
                      { name: { contains: kw, mode: "insensitive" } },
                      { address: { contains: kw, mode: "insensitive" } },
                    ],
            })),
          }
        : {}),
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
  const rows2d = sheetTo2dRows(sheet);
  let headerRow = 0;
  for (let i = 0; i < rows2d.length; i += 1) {
    const row = (rows2d[i] ?? []).map(cleanCell);
    if (findHeaderIndex(row, ["الاسم", "الفرع", "اسم الفرع", "name", "الموقع", "اسم الصراف"]) >= 0) {
      headerRow = i;
      break;
    }
  }
  const headers = (rows2d[headerRow] ?? []).map(cleanCell);
  const nameIdx = findHeaderIndex(headers, ["الاسم", "الفرع", "اسم الفرع", "name", "الموقع", "اسم الصراف"]);
  const cityIdx = findHeaderIndex(headers, ["المدينة", "المحافظة", "city"]);
  const addressIdx = findHeaderIndex(headers, ["العنوان", "address"]);
  const phoneIdx = findHeaderIndex(headers, ["الهاتف", "phone", "رقم الهاتف", "تلفون"]);
  const postalCodeIdx = findHeaderIndex(headers, ["رمز البريد", "الرمز البريدي", "صندوق بريد", "po box", "postal code", "postalCode", "zip"]);
  const workingHoursIdx = findHeaderIndex(headers, ["ساعات العمل", "اوقات العمل", "working hours", "workingHours"]);
  const notesIdx = findHeaderIndex(headers, ["ملاحظات", "notes", "ميزات الصراف", "الخدمات"]);

  if (nameIdx < 0) return NextResponse.json({ error: "Header name column not found" }, { status: 400 });

  const data = rows2d
    .slice(headerRow + 1)
    .map((r) => {
      const row = Array.isArray(r) ? r : [];
      return {
        type,
        name: cleanCell(row[nameIdx]),
        city: cityIdx >= 0 ? cleanCell(row[cityIdx]) : "",
        address: addressIdx >= 0 ? cleanCell(row[addressIdx]) : "",
        phone: phoneIdx >= 0 ? cleanCell(row[phoneIdx]) : "",
        postalCode: postalCodeIdx >= 0 ? cleanCell(row[postalCodeIdx]) : "",
        workingHours: workingHoursIdx >= 0 ? cleanCell(row[workingHoursIdx]) : "",
        notes: notesIdx >= 0 ? cleanCell(row[notesIdx]) : "",
      };
    })
    .filter((r) => r.name);

  await prisma.branchAtmEntry.deleteMany({ where: { type } });
  if (data.length) await prisma.branchAtmEntry.createMany({ data });
  return NextResponse.json({ imported: data.length });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type } = await params;
  await prisma.branchAtmEntry.deleteMany({ where: { type } });
  return NextResponse.json({ ok: true });
}
