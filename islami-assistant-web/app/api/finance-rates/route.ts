import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.financeRate.findMany({
    orderBy: [{ financeType: "asc" }, { salaryType: "asc" }, { startYear: "asc" }, { endYear: "asc" }],
    take: 5000,
  });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const financeType = String(body.financeType ?? "").trim();
  const salaryType = String(body.salaryType ?? "").trim();
  const startYear = Number(body.startYear ?? body.years ?? 0);
  const endYear = Number(body.endYear ?? body.years ?? 0);
  const rate = Number(body.rate ?? 0);
  if (!financeType || !salaryType || startYear <= 0 || endYear <= 0 || endYear < startYear) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const row = await prisma.financeRate.upsert({
    where: {
      financeType_salaryType_startYear_endYear: {
        financeType,
        salaryType,
        startYear,
        endYear,
      },
    },
    update: { rate },
    create: {
      financeType,
      salaryType,
      startYear,
      endYear,
      rate,
    },
  });
  return NextResponse.json(row);
}
