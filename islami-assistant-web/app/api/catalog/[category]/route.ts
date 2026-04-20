import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  const rows = await prisma.catalogItem.findMany({ where: { category }, orderBy: { title: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { category } = await params;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    await prisma.catalogItem.deleteMany({ where: { category } });
    const data = rows
      .map((row) => ({
        category,
        subcategory: row["subcategory"] ? String(row["subcategory"]) : null,
        title: String(row["title"] ?? row["العنوان"] ?? "").trim(),
        contentJson: JSON.stringify({
          features: String(row["features"] ?? row["المزايا"] ?? ""),
          documents: String(row["documents"] ?? row["الوثائق"] ?? ""),
          minBalance: String(row["minBalance"] ?? row["الحد الأدنى"] ?? ""),
          terms: String(row["terms"] ?? row["الشروط"] ?? ""),
        }),
        imageUrl: row["imageUrl"] ? String(row["imageUrl"]) : null,
        pdfUrl: row["pdfUrl"] ? String(row["pdfUrl"]) : null,
      }))
      .filter((row) => row.title);
    if (data.length) await prisma.catalogItem.createMany({ data });
    return NextResponse.json({ imported: data.length });
  }
  const body = await request.json();
  const row = await prisma.catalogItem.create({
    data: {
      category,
      subcategory: body.subcategory ? String(body.subcategory) : null,
      title: String(body.title ?? ""),
      contentJson: JSON.stringify(body.content ?? {}),
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      pdfUrl: body.pdfUrl ? String(body.pdfUrl) : null,
    },
  });
  return NextResponse.json(row);
}
