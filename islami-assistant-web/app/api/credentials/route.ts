import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.credentialEntry.findMany({ orderBy: { system: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const row = await prisma.credentialEntry.create({
    data: {
      system: String(body.system ?? ""),
      username: String(body.username ?? ""),
      password: String(body.password ?? ""),
    },
  });
  return NextResponse.json(row);
}
