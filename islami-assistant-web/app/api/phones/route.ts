import { auth } from "@/auth";
import { cleanCell, findHeaderIndex, sheetTo2dRows } from "@/lib/excel-utils";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const governorate = new URL(request.url).searchParams.get("governorate") ?? "";
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const rows = await prisma.phoneEntry.findMany({
    where: {
      ...(governorate ? { governorate } : {}),
      ...(q
        ? {
            OR: [{ branchName: { contains: q } }, { phone: { contains: q } }],
          }
        : {}),
    },
    orderBy: { branchName: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    const governorate = String(form.get("governorate") ?? "").trim();
    if (!(file instanceof File) || !governorate) {
      return NextResponse.json({ error: "file and governorate are required" }, { status: 400 });
    }
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows2d = sheetTo2dRows(sheet);
    const headerRow = (rows2d.find((row) => findHeaderIndex((row ?? []).map(cleanCell), ["الفرع", "اسم الفرع", "branch"]) >= 0) ?? []) as unknown[];
    const headers = headerRow.map(cleanCell);
    const branchIdx = findHeaderIndex(headers, ["الفرع", "اسم الفرع", "branch", "الموقع"]);
    const phoneIdx = findHeaderIndex(headers, ["الهاتف", "phone", "رقم الهاتف", "تلفون"]);
    const headerIndex = rows2d.findIndex((row) => row === headerRow);
    if (branchIdx < 0 || phoneIdx < 0 || headerIndex < 0) {
      return NextResponse.json({ error: "Header mapping failed for phones file" }, { status: 400 });
    }
    const data = rows2d
      .slice(headerIndex + 1)
      .map((rowRaw) => {
        const row = Array.isArray(rowRaw) ? rowRaw : [];
        return {
        governorate,
        branchName: cleanCell(row[branchIdx]),
        phone: cleanCell(row[phoneIdx]),
      };
      })
      .filter((r) => r.branchName && r.phone);
    await prisma.phoneEntry.deleteMany({ where: { governorate } });
    if (data.length) await prisma.phoneEntry.createMany({ data });
    return NextResponse.json({ imported: data.length, governorate });
  }
  const body = await request.json();
  const row = await prisma.phoneEntry.create({
    data: {
      governorate: String(body.governorate ?? ""),
      branchName: String(body.branchName ?? ""),
      phone: String(body.phone ?? ""),
    },
  });
  return NextResponse.json(row);
}
