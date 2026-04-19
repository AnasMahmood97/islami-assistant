import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();

  const data: { name?: string; role?: UserRole; passwordHash?: string } = {};
  if (body.name != null) data.name = String(body.name);
  if (body.role === "ADMIN" || body.role === "EMPLOYEE") data.role = body.role as UserRole;
  if (body.password) data.passwordHash = await bcrypt.hash(String(body.password), 10);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, username: true, role: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (id === session.user?.id) return NextResponse.json({ error: "لا يمكن حذف حسابك" }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
