import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const financeType = searchParams.get("financeType") ?? "";
  const salaryType = searchParams.get("salaryType") ?? "";
  const years = Number(searchParams.get("years") ?? "0");

  const row = await prisma.financeRate.findUnique({
    where: {
      financeType_salaryType_years: { financeType, salaryType, years },
    },
  });
  return NextResponse.json({ rate: row?.rate ?? null });
}
