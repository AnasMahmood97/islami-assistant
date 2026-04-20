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
  const row = await prisma.phoneEntry.update({
    where: { id },
    data: {
      governorate: body.governorate != null ? String(body.governorate) : undefined,
      branchName: body.branchName != null ? String(body.branchName) : undefined,
      phone: body.phone != null ? String(body.phone) : undefined,
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
  await prisma.phoneEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
