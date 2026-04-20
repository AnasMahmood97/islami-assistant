import { auth } from "@/auth";
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
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const data = rows
      .map((row) => ({
        governorate,
        branchName: String(row["الفرع"] ?? row["اسم الفرع"] ?? row["branch"] ?? "").trim(),
        phone: String(row["الهاتف"] ?? row["phone"] ?? "").trim(),
      }))
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
