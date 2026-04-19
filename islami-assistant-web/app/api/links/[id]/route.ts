import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
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
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.linkEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
