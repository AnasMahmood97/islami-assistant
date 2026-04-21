import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const financeType = searchParams.get("financeType") ?? "";
  const salaryType = searchParams.get("salaryType") ?? "";
  const years = Number(searchParams.get("years") ?? "0");

  const row = await prisma.financeRate.findFirst({
    where: {
      financeType,
      salaryType,
      startYear: { lte: years },
      endYear: { gte: years },
    },
    orderBy: [{ endYear: "asc" }, { startYear: "asc" }],
  });
  return NextResponse.json({ rate: row?.rate ?? null, startYear: row?.startYear ?? null, endYear: row?.endYear ?? null });
}
