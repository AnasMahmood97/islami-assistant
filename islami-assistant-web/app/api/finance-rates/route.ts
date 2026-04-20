import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.financeRate.findMany({
    orderBy: [{ financeType: "asc" }, { salaryType: "asc" }, { years: "asc" }],
    take: 5000,
  });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const row = await prisma.financeRate.upsert({
    where: {
      financeType_salaryType_years: {
        financeType: String(body.financeType ?? ""),
        salaryType: String(body.salaryType ?? ""),
        years: Number(body.years ?? 0),
      },
    },
    update: { rate: Number(body.rate ?? 0) },
    create: {
      financeType: String(body.financeType ?? ""),
      salaryType: String(body.salaryType ?? ""),
      years: Number(body.years ?? 0),
      rate: Number(body.rate ?? 0),
    },
  });
  return NextResponse.json(row);
}
