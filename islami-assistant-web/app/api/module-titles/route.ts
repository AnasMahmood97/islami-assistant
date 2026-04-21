import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_TITLES: Record<string, string> = {
  accounts: "الحسابات",
  cards: "البطاقات",
  offers: "العروض",
  products: "المنتجات",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.moduleTitle.findMany();
  const map = Object.fromEntries(rows.map((row) => [row.key, row.title]));
  return NextResponse.json({ ...DEFAULT_TITLES, ...map });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const key = String(body?.key ?? "");
  const title = String(body?.title ?? "").trim();
  if (!key || !title) return NextResponse.json({ error: "Missing key/title" }, { status: 400 });
  const row = await prisma.moduleTitle.upsert({
    where: { key },
    create: { key, title },
    update: { title },
  });
  return NextResponse.json(row);
}
