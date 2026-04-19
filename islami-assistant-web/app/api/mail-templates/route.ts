import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.mailTemplate.findMany({ orderBy: { title: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const row = await prisma.mailTemplate.create({
    data: {
      title: String(body.title ?? ""),
      body: String(body.body ?? ""),
      instructions: body.instructions ? String(body.instructions) : null,
    },
  });
  return NextResponse.json(row);
}
