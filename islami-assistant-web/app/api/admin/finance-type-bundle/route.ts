import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type IncomingRange = {
  salaryType: string;
  startYear: number;
  endYear: number;
  rate: number;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const financeType = String(body.financeType ?? "").trim();
  const oldFinanceType = body.oldFinanceType ? String(body.oldFinanceType).trim() : "";
  const label = body.label ? String(body.label).trim() : financeType;
  const imageUrl = body.imageUrl ? String(body.imageUrl) : body.imagePath ? String(body.imagePath) : null;
  const pdfUrl = body.pdfUrl ? String(body.pdfUrl) : body.pdfPath ? String(body.pdfPath) : null;
  const rangesRaw: Record<string, unknown>[] = Array.isArray(body.ranges) ? body.ranges : [];

  if (!financeType) return NextResponse.json({ error: "financeType required" }, { status: 400 });

  const ranges: IncomingRange[] = rangesRaw
    .map((r: Record<string, unknown>) => ({
      salaryType: String(r.salaryType ?? "").trim(),
      startYear: Number(r.startYear ?? 0),
      endYear: Number(r.endYear ?? 0),
      rate: Number(r.rate ?? 0),
    }))
    .filter((r) => r.salaryType && r.startYear > 0 && r.endYear >= r.startYear && Number.isFinite(r.rate));

  await prisma.$transaction(async (tx) => {
    await tx.financeTypeConfig.upsert({
      where: { financeType },
      update: { label, imageUrl, pdfUrl },
      create: { financeType, label, imageUrl, pdfUrl },
    });

    await tx.financeRate.deleteMany({ where: { financeType } });
    if (ranges.length > 0) {
      await tx.financeRate.createMany({
        data: ranges.map((r) => ({
          financeType,
          salaryType: r.salaryType,
          startYear: r.startYear,
          endYear: r.endYear,
          rate: r.rate,
        })),
      });
    }

    if (oldFinanceType && oldFinanceType !== financeType) {
      await tx.financeRate.deleteMany({ where: { financeType: oldFinanceType } });
      await tx.financeTypeConfig.deleteMany({ where: { financeType: oldFinanceType } });
    }
  });

  return NextResponse.json({ ok: true });
}
