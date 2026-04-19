import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Question required" }, { status: 400 });

  const record = await prisma.unknownQuestion.create({
    data: { userId: session.user.id, text },
  });
  return NextResponse.json(record);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await prisma.unknownQuestion.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });
  return NextResponse.json(rows);
}
