import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const status = body.status ? String(body.status) : undefined;
  const resolvedKnowledgeItemId = body.resolvedKnowledgeItemId
    ? String(body.resolvedKnowledgeItemId)
    : undefined;

  const row = await prisma.unknownQuestion.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(resolvedKnowledgeItemId !== undefined ? { resolvedKnowledgeItemId } : {}),
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.unknownQuestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
