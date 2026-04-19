import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
