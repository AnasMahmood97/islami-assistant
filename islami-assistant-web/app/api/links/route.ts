import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [shared, privateRows] = await Promise.all([
    prisma.linkEntry.findMany({ orderBy: { system: "asc" } }),
    prisma.privateLinkEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { label: "asc" },
    }),
  ]);
  return NextResponse.json({
    shared,
    private: privateRows,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const isPrivate = Boolean(body.isPrivate);
  if (isPrivate) {
    const row = await prisma.privateLinkEntry.create({
      data: {
        userId: session.user.id,
        label: String(body.system ?? body.label ?? ""),
        url: String(body.url ?? ""),
      },
    });
    return NextResponse.json(row);
  }
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const row = await prisma.linkEntry.create({
    data: {
      system: String(body.system ?? ""),
      url: String(body.url ?? ""),
    },
  });
  await prisma.systemDefinition.upsert({
    where: { name: row.system },
    update: { linkUrl: row.url },
    create: { name: row.system, linkUrl: row.url },
  });
  return NextResponse.json(row);
}
