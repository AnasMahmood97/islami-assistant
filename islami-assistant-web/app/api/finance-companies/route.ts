import { auth } from "@/auth";
import { cleanCell, findHeaderIndex, sheetTo2dRows } from "@/lib/excel-utils";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";

const EXPECTED_ORDERED_HEADERS = [
  "اسم الشركة",
  "ملاحظات",
  "فئة الاعتماد",
  "نسب الربح",
  "تاريخ انتهاء العرض القائم",
  "راتب محول من 1 الى 4",
  "راتب محول من 5 الى 7",
  "راتب محول من 8 الى 10",
  "راتب غير محول من 1 الى 4",
  "راتب غير محول من 5 الى 7",
  "راتب غير محول من 8 الى 10",
  "راتب محول من 1 الى 7",
  "راتب محول من 8 الى 15",
  "راتب محول من 15 الى 20",
  "راتب محول من 21 الى 25",
  "راتب غير محول من 1 الى 7",
  "راتب غير محول من 8 الى 15",
  "راتب غير محول من 15 الى 20",
  "راتب غير محول من 21 الى 25",
  "راتب محول من 1 الى 4",
  "راتب محول من 5 الى 7",
  "راتب محول من 8 الى 10",
  "راتب غير محول من 1 الى 4",
  "راتب غير محول من 5 الى 7",
  "راتب غير محول من 8 الى 10",
] as const;

function detectHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i += 1) {
    const normalized = (rows[i] ?? []).map(cleanCell);
    const hasCore =
      findHeaderIndex(normalized, ["اسم الشركة"]) >= 0 &&
      findHeaderIndex(normalized, ["ملاحظات", "ملاحظة"]) >= 0 &&
      findHeaderIndex(normalized, ["فئة الاعتماد", "فئة"]) >= 0 &&
      findHeaderIndex(normalized, ["نسب الربح", "نسبة الربح", "الربح"]) >= 0;
    // Practical guard: ignore top title-only row while allowing row 2 headers.
    if (hasCore && i >= 1) return i;
  }
  return -1;
}

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const tab = new URL(request.url).searchParams.get("tab") ?? "all";
  const qFilter = q.trim();
  const tabFilter = tab === "murabaha" ? "مرابحة" : tab === "ijara" ? "إجارة" : tab === "stocks" ? "أسهم" : "";

  const rows = await prisma.accreditedCompany.findMany({
    where: {
      ...(qFilter
        ? {
            OR: [
              { name: { contains: qFilter, mode: "insensitive" } },
              { notes: { contains: qFilter, mode: "insensitive" } },
              { category: { contains: qFilter, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(tabFilter ? { category: { contains: tabFilter, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(rows);
}

function val(row: unknown[], index: number): string {
  return index >= 0 ? cleanCell(row[index]) : "";
}

function excelSerialToIsoDate(value: number): string {
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed) return String(value);
  const yyyy = String(parsed.y).padStart(4, "0");
  const mm = String(parsed.m).padStart(2, "0");
  const dd = String(parsed.d).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeExpiry(rawValue: unknown): string | null {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return excelSerialToIsoDate(rawValue);
  }
  const text = cleanCell(rawValue);
  return text || null;
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
  const rows2d = sheetTo2dRows(sheet);
  const headerRowIdx = detectHeaderRow(rows2d);
  if (headerRowIdx < 0) {
    return NextResponse.json(
      { error: "تعذر تحديد صف العناوين. يجب وجود: اسم الشركة، ملاحظات، فئة الاعتماد، نسب الربح" },
      { status: 400 }
    );
  }
  const headers = rows2d[headerRowIdx].map(cleanCell);
  const dataRows = rows2d.slice(headerRowIdx + 1);
  const companyStartIndex = findHeaderIndex(headers, ["اسم الشركة"]);
  if (companyStartIndex < 0) {
    return NextResponse.json({ error: "تعذر العثور على عمود: اسم الشركة" }, { status: 400 });
  }

  const actualOrderedHeaders = headers.slice(companyStartIndex, companyStartIndex + EXPECTED_ORDERED_HEADERS.length);
  if (actualOrderedHeaders.length < EXPECTED_ORDERED_HEADERS.length) {
    return NextResponse.json({ error: "عدد الأعمدة أقل من 25 عمودًا بعد اسم الشركة" }, { status: 400 });
  }

  const mismatches = EXPECTED_ORDERED_HEADERS.map((expected, idx) => ({
    idx,
    expected,
    actual: actualOrderedHeaders[idx] ?? "",
  })).filter((row) => row.expected !== row.actual);

  if (mismatches.length > 0) {
    return NextResponse.json(
      {
        error: "عناوين الأعمدة لا تطابق الخريطة المعتمدة للملف",
        mismatches: mismatches.slice(0, 8),
      },
      { status: 400 },
    );
  }

  const data = dataRows
    .map((rowRaw) => {
      const row = Array.isArray(rowRaw) ? rowRaw : [];
      const at = (offset: number) => val(row, companyStartIndex + offset);
      const atRaw = (offset: number) => row[companyStartIndex + offset];
      const name = at(0);
      return {
        name,
        notes: at(1) || null,
        category: at(2) || null,
        profitRateInfo: at(3) || null,
        expiryDate: normalizeExpiry(atRaw(4)),
        murabaha_1_4: at(5) || null,
        murabaha_5_7: at(6) || null,
        murabaha_8_10: at(7) || null,
        murabaha_un_1_4: at(8) || null,
        murabaha_un_5_7: at(9) || null,
        murabaha_un_8_10: at(10) || null,
        ijara_1_7: at(11) || null,
        ijara_8_15: at(12) || null,
        ijara_15_20: at(13) || null,
        ijara_21_25: at(14) || null,
        ijara_un_1_7: at(15) || null,
        ijara_un_8_15: at(16) || null,
        ijara_un_15_20: at(17) || null,
        ijara_un_21_25: at(18) || null,
        stocks_1_4: at(19) || null,
        stocks_5_7: at(20) || null,
        stocks_8_10: at(21) || null,
        stocks_un_1_4: at(22) || null,
        stocks_un_5_7: at(23) || null,
        stocks_un_8_10: at(24) || null,
      };
    })
    .filter((r) => r.name);

  await prisma.accreditedCompany.deleteMany();
  if (data.length) await prisma.accreditedCompany.createMany({ data });
  return NextResponse.json({ imported: data.length, syncMode: "replace" });
}

export async function DELETE() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.accreditedCompany.deleteMany();
  return NextResponse.json({ ok: true });
}
