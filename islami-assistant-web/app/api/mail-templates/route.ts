import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.mailTemplate.findMany({
    where: {
      OR: [
        { scope: "SHARED" },
        { ownerId: session.user.id },
      ],
    },
    orderBy: [{ scope: "asc" }, { title: "asc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const requestedScope = String(body.scope ?? "").toUpperCase();
  const scope = requestedScope === "PRIVATE" || session.user.role !== "ADMIN" ? "PRIVATE" : "SHARED";
  const row = await prisma.mailTemplate.create({
    data: {
      ownerId: scope === "PRIVATE" ? session.user.id : null,
      scope,
      title: String(body.title ?? ""),
      subject: body.subject ? String(body.subject) : null,
      body: String(body.body ?? ""),
      notes: body.notes ? String(body.notes) : null,
      instructions: body.instructions ? String(body.instructions) : null,
    },
  });
  return NextResponse.json(row);
}
