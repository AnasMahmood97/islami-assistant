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
  const keywords = q
    .trim()
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const rows = await prisma.phoneEntry.findMany({
    where: {
      ...(governorate ? { governorate } : {}),
      ...(keywords.length
        ? {
            AND: keywords.map((kw) => ({
              OR: [
                { location: { contains: kw, mode: "insensitive" } },
                { address: { contains: kw, mode: "insensitive" } },
                { extension: { contains: kw, mode: "insensitive" } },
                { phone: { contains: kw, mode: "insensitive" } },
                { poBox: { contains: kw, mode: "insensitive" } },
              ],
            })),
          }
        : {}),
    },
    orderBy: { location: "asc" },
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
    const headerRow = (rows2d.find((row) => findHeaderIndex((row ?? []).map(cleanCell), ["الموقع", "اسم الفرع", "الفرع", "location"]) >= 0) ?? []) as unknown[];
    const headers = headerRow.map(cleanCell);
    const locationIdx = findHeaderIndex(headers, ["الموقع", "اسم الفرع", "الفرع", "location"]);
    const addressIdx = findHeaderIndex(headers, ["العنوان", "address"]);
    const extensionIdx = findHeaderIndex(headers, ["فرعي", "الفرعي", "extension"]);
    const phoneIdx = findHeaderIndex(headers, ["الهاتف", "phone", "رقم الهاتف", "تلفون"]);
    const poBoxIdx = findHeaderIndex(headers, ["صندوق بريد", "po box", "p.o box", "رمز البريد", "الرمز البريدي"]);
    const headerIndex = rows2d.findIndex((row) => row === headerRow);
    if (locationIdx < 0 || phoneIdx < 0 || headerIndex < 0) {
      return NextResponse.json({ error: "Header mapping failed for phones file" }, { status: 400 });
    }
    const data = rows2d
      .slice(headerIndex + 1)
      .map((rowRaw) => {
        const row = Array.isArray(rowRaw) ? rowRaw : [];
        return {
          governorate,
          location: cleanCell(row[locationIdx]),
          address: addressIdx >= 0 ? cleanCell(row[addressIdx]) : "",
          extension: extensionIdx >= 0 ? cleanCell(row[extensionIdx]) : "",
          phone: cleanCell(row[phoneIdx]),
          poBox: poBoxIdx >= 0 ? cleanCell(row[poBoxIdx]) : "",
        };
      })
      .filter((r) => r.location && r.phone);
    await prisma.phoneEntry.deleteMany({ where: { governorate } });
    if (data.length) await prisma.phoneEntry.createMany({ data });
    return NextResponse.json({ imported: data.length, governorate });
  }
  const body = await request.json();
  const row = await prisma.phoneEntry.create({
    data: {
      governorate: String(body.governorate ?? ""),
      location: String(body.location ?? ""),
      address: body.address != null ? String(body.address) : null,
      extension: body.extension != null ? String(body.extension) : null,
      phone: String(body.phone ?? ""),
      poBox: body.poBox != null ? String(body.poBox) : null,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const governorate = new URL(request.url).searchParams.get("governorate") ?? "";
  await prisma.phoneEntry.deleteMany({ where: governorate ? { governorate } : undefined });
  return NextResponse.json({ ok: true });
}
