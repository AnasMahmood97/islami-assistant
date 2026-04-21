import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const row = await prisma.financeRate.update({
    where: { id },
    data: {
      financeType: body.financeType != null ? String(body.financeType) : undefined,
      salaryType: body.salaryType != null ? String(body.salaryType) : undefined,
      startYear: body.startYear != null ? Number(body.startYear) : undefined,
      endYear: body.endYear != null ? Number(body.endYear) : undefined,
      rate: body.rate != null ? Number(body.rate) : undefined,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.financeRate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
