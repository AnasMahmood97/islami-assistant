import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ count: 0 });
  const count = await prisma.unknownQuestion.count({ where: { status: "PENDING" } });
  return NextResponse.json({ count });
}
