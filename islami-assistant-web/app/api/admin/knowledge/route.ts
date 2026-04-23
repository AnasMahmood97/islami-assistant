import { auth } from "@/auth";
import { sanitizeKnowledgeImageUrl } from "@/lib/knowledge-image-url";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.knowledgeItem.findMany({ orderBy: { createdAt: "desc" }, take: 3000 });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const cleanImageUrl = sanitizeKnowledgeImageUrl(body.imageUrl ? String(body.imageUrl) : null);
  const item = await prisma.knowledgeItem.create({
    data: {
      question: String(body.question ?? ""),
      answer: String(body.answer ?? ""),
      imageUrl: cleanImageUrl,
      keywords: body.keywords ? String(body.keywords) : null,
    },
  });
  return NextResponse.json(item);
}
