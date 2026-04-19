import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const governorate = new URL(request.url).searchParams.get("governorate") ?? "";
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const rows = await prisma.phoneEntry.findMany({
    where: {
      ...(governorate ? { governorate } : {}),
      ...(q
        ? {
            OR: [{ branchName: { contains: q } }, { phone: { contains: q } }],
          }
        : {}),
    },
    orderBy: { branchName: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const row = await prisma.phoneEntry.create({
    data: {
      governorate: String(body.governorate ?? ""),
      branchName: String(body.branchName ?? ""),
      phone: String(body.phone ?? ""),
    },
  });
  return NextResponse.json(row);
}
