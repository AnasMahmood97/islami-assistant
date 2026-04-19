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

  if (session.user.role !== "ADMIN") {
    const existing = await prisma.credentialEntry.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.credentialEntry.update({
    where: { id },
    data: {
      ...(body.username != null ? { username: String(body.username) } : {}),
      ...(body.password != null ? { password: String(body.password) } : {}),
      ...(session.user.role === "ADMIN" && body.system != null ? { system: String(body.system) } : {}),
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
  await prisma.credentialEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
