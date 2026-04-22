import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LABELS = {
  featuresLabel: "المزايا",
  documentsLabel: "الوثائق المطلوبة",
  minBalanceLabel: "الحد الأدنى للرصيد",
  termsLabel: "الشروط والأحكام",
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const category = new URL(request.url).searchParams.get("category");
  if (!category) return NextResponse.json({ error: "category required" }, { status: 400 });

  const row = await prisma.catalogSectionConfig.findUnique({ where: { category } });
  return NextResponse.json({ category, ...DEFAULT_LABELS, ...(row ?? {}) });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const category = String(body?.category ?? "").trim();
  if (!category) return NextResponse.json({ error: "category required" }, { status: 400 });

  const data = {
    featuresLabel: body.featuresLabel ? String(body.featuresLabel).trim() : undefined,
    documentsLabel: body.documentsLabel ? String(body.documentsLabel).trim() : undefined,
    minBalanceLabel: body.minBalanceLabel ? String(body.minBalanceLabel).trim() : undefined,
    termsLabel: body.termsLabel ? String(body.termsLabel).trim() : undefined,
  };

  const row = await prisma.catalogSectionConfig.upsert({
    where: { category },
    create: {
      category,
      featuresLabel: data.featuresLabel ?? DEFAULT_LABELS.featuresLabel,
      documentsLabel: data.documentsLabel ?? DEFAULT_LABELS.documentsLabel,
      minBalanceLabel: data.minBalanceLabel ?? DEFAULT_LABELS.minBalanceLabel,
      termsLabel: data.termsLabel ?? DEFAULT_LABELS.termsLabel,
    },
    update: data,
  });
  return NextResponse.json(row);
}
