import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const row = await prisma.mailTemplate.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.scope === "PRIVATE" && row.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(row);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const existing = await prisma.mailTemplate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.scope === "SHARED" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.scope === "PRIVATE" && existing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const row = await prisma.mailTemplate.update({
    where: { id },
    data: {
      title: body.title != null ? String(body.title) : undefined,
      subject: body.subject !== undefined ? (body.subject ? String(body.subject) : null) : undefined,
      body: body.body != null ? String(body.body) : undefined,
      notes: body.notes !== undefined ? (body.notes ? String(body.notes) : null) : undefined,
      instructions: body.instructions !== undefined ? (body.instructions ? String(body.instructions) : null) : undefined,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.mailTemplate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.scope === "SHARED" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.scope === "PRIVATE" && existing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.mailTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
