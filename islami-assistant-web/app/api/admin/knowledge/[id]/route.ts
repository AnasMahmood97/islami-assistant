import { auth } from "@/auth";
import { sanitizeKnowledgeImageUrl } from "@/lib/knowledge-image-url";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const cleanImageUrl =
    body.imageUrl !== undefined ? sanitizeKnowledgeImageUrl(body.imageUrl ? String(body.imageUrl) : null) : undefined;
  const row = await prisma.knowledgeItem.update({
    where: { id },
    data: {
      question: body.question != null ? String(body.question) : undefined,
      answer: body.answer != null ? String(body.answer) : undefined,
      keywords: body.keywords !== undefined ? (body.keywords ? String(body.keywords) : null) : undefined,
      imageUrl: cleanImageUrl,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.knowledgeItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
