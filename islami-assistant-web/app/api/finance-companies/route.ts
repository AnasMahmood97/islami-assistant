import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normKey(value: unknown): string {
  return clean(value).replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/\s+/g, "");
}

function findHeaderIndex(headers: string[], aliases: string[]): number {
  const normalizedHeaders = headers.map((h) => normKey(h));
  const normalizedAliases = aliases.map((a) => normKey(a));
  for (let i = 0; i < normalizedHeaders.length; i += 1) {
    const h = normalizedHeaders[i];
    if (!h) continue;
    if (normalizedAliases.some((a) => h === a || h.includes(a) || a.includes(h))) {
      return i;
    }
  }
  return -1;
}

function detectHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i += 1) {
    const normalized = (rows[i] ?? []).map(clean);
    const hasCore =
      findHeaderIndex(normalized, ["اسم الشركة"]) >= 0 &&
      findHeaderIndex(normalized, ["ملاحظات", "ملاحظة"]) >= 0 &&
      findHeaderIndex(normalized, ["فئة الاعتماد", "فئة"]) >= 0 &&
      findHeaderIndex(normalized, ["نسب الربح", "نسبة الربح", "الربح"]) >= 0;
    // Practical guard: ignore title rows before the table starts.
    if (hasCore && i >= 2) return i;
  }
  return -1;
}

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
  const rows2d = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const headerRowIdx = detectHeaderRow(rows2d);
  if (headerRowIdx < 0) {
    return NextResponse.json(
      { error: "تعذر تحديد صف العناوين. يجب وجود: اسم الشركة، ملاحظات، فئة الاعتماد، نسب الربح" },
      { status: 400 }
    );
  }
  const headers = rows2d[headerRowIdx].map(clean);
  const dataRows = rows2d.slice(headerRowIdx + 1);
  const companyIndex = findHeaderIndex(headers, ["اسم الشركة"]);
  const notesIndex = findHeaderIndex(headers, ["ملاحظات", "ملاحظة"]);
  const categoryIndex = findHeaderIndex(headers, ["فئة الاعتماد", "فئة"]);
  const profitIndex = findHeaderIndex(headers, ["نسب الربح", "نسبة الربح", "الربح"]);
  const cityIndex = findHeaderIndex(headers, ["المدينة", "المحافظة"]);
  const phoneIndex = findHeaderIndex(headers, ["الهاتف", "رقم الهاتف"]);
  if (companyIndex < 0 || notesIndex < 0 || categoryIndex < 0 || profitIndex < 0) {
    return NextResponse.json({ error: "أعمدة مطلوبة غير مكتملة في الملف" }, { status: 400 });
  }

  const data = dataRows
    .map((rowRaw, dataIndex) => {
      const row = Array.isArray(rowRaw) ? rowRaw : [];
      const name = clean(row[companyIndex]);
      const notes = clean(row[notesIndex]);
      const category = clean(row[categoryIndex]);
      const profit = clean(row[profitIndex]);
      const excelRow = headerRowIdx + 2 + dataIndex;
      const noteAddr = XLSX.utils.encode_cell({ r: excelRow - 1, c: notesIndex });
      const noteCell = sheet[noteAddr] as { c?: { t?: string }[] } | undefined;
      const noteComment = clean(noteCell?.c?.map((entry) => entry.t ?? "").join(" ") ?? "");
      return {
        name,
        notes: [notes, noteComment, category ? `فئة الاعتماد: ${category}` : "", profit ? `نسب الربح: ${profit}` : ""]
          .filter(Boolean)
          .join(" | "),
        city: cityIndex >= 0 ? clean(row[cityIndex]) : "",
        phone: phoneIndex >= 0 ? clean(row[phoneIndex]) : "",
      };
    })
    .filter((r) => r.name);

  await prisma.approvedCompany.deleteMany();
  if (data.length) await prisma.approvedCompany.createMany({ data });
  return NextResponse.json({ imported: data.length, syncMode: "replace" });
}
