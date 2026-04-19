import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.financeTypeConfig.findMany();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const row = await prisma.financeTypeConfig.upsert({
    where: { financeType: String(body.financeType ?? "") },
    create: {
      financeType: String(body.financeType ?? ""),
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
    },
    update: {
      imageUrl: body.imageUrl !== undefined ? (body.imageUrl ? String(body.imageUrl) : null) : undefined,
    },
  });
  return NextResponse.json(row);
}
