import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const username = String(body.username ?? "").trim();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");
  const role = body.role === "ADMIN" ? UserRole.ADMIN : UserRole.EMPLOYEE;
  if (!username || !name || !password) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, name, passwordHash, role },
    select: { id: true, name: true, username: true, role: true },
  });
  return NextResponse.json(user);
}
