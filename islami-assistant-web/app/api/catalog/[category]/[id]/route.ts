import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function assertAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string }> }
) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { category, id } = await params;
  const body = await request.json();
  const existing = await prisma.catalogItem.findFirst({ where: { id, category } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = await prisma.catalogItem.update({
    where: { id },
    data: {
      subcategory: body.subcategory !== undefined ? (body.subcategory ? String(body.subcategory) : null) : undefined,
      title: body.title != null ? String(body.title) : undefined,
      contentJson: body.content ? JSON.stringify(body.content) : undefined,
      imageUrl: body.imageUrl !== undefined ? (body.imageUrl ? String(body.imageUrl) : null) : undefined,
      pdfUrl: body.pdfUrl !== undefined ? (body.pdfUrl ? String(body.pdfUrl) : null) : undefined,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string }> }
) {
  if (!(await assertAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { category, id } = await params;
  const existing = await prisma.catalogItem.findFirst({ where: { id, category } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.catalogItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
