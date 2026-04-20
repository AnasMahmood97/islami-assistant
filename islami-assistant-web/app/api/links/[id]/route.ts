import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  if (body.isPrivate) {
    const existing = await prisma.privateLinkEntry.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const row = await prisma.privateLinkEntry.update({
      where: { id },
      data: {
        label: body.label != null ? String(body.label) : undefined,
        url: body.url != null ? String(body.url) : undefined,
      },
    });
    return NextResponse.json(row);
  }
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const row = await prisma.linkEntry.update({
    where: { id },
    data: {
      system: body.system != null ? String(body.system) : undefined,
      url: body.url != null ? String(body.url) : undefined,
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
  const privateRow = await prisma.privateLinkEntry.findUnique({ where: { id } });
  if (privateRow) {
    if (privateRow.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.privateLinkEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.linkEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
