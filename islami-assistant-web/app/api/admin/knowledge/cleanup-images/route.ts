import { auth } from "@/auth";
import { sanitizeKnowledgeImageUrl } from "@/lib/knowledge-image-url";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.knowledgeItem.findMany({
    select: { id: true, imageUrl: true },
    take: 5000,
  });

  const invalidIds = rows
    .filter((row) => {
      if (!row.imageUrl) return false;
      const raw = String(row.imageUrl).trim();
      if (!raw) return true;
      if (!raw.includes(".")) return true;
      return !sanitizeKnowledgeImageUrl(raw);
    })
    .map((row) => row.id);

  if (invalidIds.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  const result = await prisma.knowledgeItem.updateMany({
    where: { id: { in: invalidIds } },
    data: { imageUrl: null },
  });

  return NextResponse.json({ cleaned: result.count });
}
