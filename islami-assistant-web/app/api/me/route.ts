import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, username: true, role: true, theme: true, avatarUrl: true, language: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();

  const data: {
    name?: string;
    theme?: string | null;
    language?: string | null;
    avatarUrl?: string | null;
    passwordHash?: string;
  } = {};

  if (body.name != null) data.name = String(body.name);
  if (body.theme != null) data.theme = String(body.theme);
  if (body.language != null) data.language = String(body.language);
  if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl ? String(body.avatarUrl) : null;

  if (body.newPassword) {
    const cur = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!body.currentPassword) return NextResponse.json({ error: "أدخل كلمة المرور الحالية" }, { status: 400 });
    const ok = await bcrypt.compare(String(body.currentPassword), cur.passwordHash);
    if (!ok) return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    data.passwordHash = await bcrypt.hash(String(body.newPassword), 10);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, username: true, role: true, theme: true, avatarUrl: true },
  });
  return NextResponse.json(user);
}
