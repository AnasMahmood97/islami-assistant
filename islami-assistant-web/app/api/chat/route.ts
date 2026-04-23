import { auth } from "@/auth";
import { greetUserLine } from "@/lib/greeting";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

function cleanKnowledgeImageUrl(pathValue?: string | null) {
  const raw = String(pathValue ?? "").trim();
  if (!raw || /^\d+$/.test(raw)) return null;

  let normalized = raw.replace(/\\/g, "/");
  if (normalized.startsWith("public/")) {
    normalized = normalized.slice("public/".length);
  }
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://") && !normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  const imagePathPattern = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?(#.*)?$/i;
  if (!imagePathPattern.test(normalized) || /\s/.test(normalized)) {
    return null;
  }

  return normalized;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const question = String(body.question ?? "").trim();
  const attachmentUrl = body.attachmentUrl ? String(body.attachmentUrl).trim() : null;
  if (!question) return NextResponse.json({ error: "Question required" }, { status: 400 });

  const dayKey = new Date().toISOString().slice(0, 10);
  let chatSession = await prisma.chatSession.findFirst({
    where: { userId: session.user.id, dayKey },
    orderBy: { createdAt: "desc" },
  });

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId: session.user.id, dayKey },
    });
  }

  const knowledge = await prisma.knowledgeItem.findMany({ take: 2000 });
  const qNorm = normalize(question);
  const qTokens = tokenize(question);
  const scoreItem = (item: (typeof knowledge)[number]): number => {
    const iq = normalize(item.question);
    const ia = normalize(item.answer);
    const keywords = (item.keywords ?? "")
      .split(/[,\n]/)
      .map((k) => normalize(k))
      .filter(Boolean);
    let score = 0;
    if (qNorm === iq) score += 150;
    if (iq.includes(qNorm) || qNorm.includes(iq)) score += 60;
    for (const token of qTokens) {
      if (token.length <= 1 && !/\d/.test(token)) continue;
      if (keywords.some((k) => k.includes(token))) score += 25;
      if (iq.includes(token)) score += 15;
      if (ia.includes(token)) score += 5;
    }
    if (/^\d+$/.test(qNorm) && keywords.includes(qNorm)) score += 120;
    return score;
  };
  let top: (typeof knowledge)[number] | null = null;
  let topScore = 0;
  for (const item of knowledge) {
    const score = scoreItem(item);
    const currentHasImage = Boolean(cleanKnowledgeImageUrl(top?.imageUrl ?? null));
    const candidateHasImage = Boolean(cleanKnowledgeImageUrl(item.imageUrl ?? null));
    if (score > topScore || (score === topScore && candidateHasImage && !currentHasImage)) {
      topScore = score;
      top = item;
    }
  }
  const match = topScore >= 35 ? top : null;

  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: "user",
      text: question,
    },
  });

  const fallback =
    "أنا ذكاء اصطناعي مخصص فقط لمساعدتك في استفسارات تتعلق بالبنك، ولا يمكنني الإجابة عن أي موضوع خارج الملف المعتمد حاليًا.";

  const userLabel = session.user?.name ?? "موظف";
  const reply = match
    ? `${greetUserLine(userLabel)}.\n\n${match.answer.trim()}`
    : fallback;
  const rawImageUrl = typeof match?.imageUrl === "string" ? match.imageUrl : null;
  const responseImageUrl = cleanKnowledgeImageUrl(rawImageUrl);
  await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: "assistant",
      text: reply,
      matchedKnowledgeItemId: match?.id,
    },
  });

  return NextResponse.json({
    answer: reply,
    imageUrl: responseImageUrl,
    attachmentUrl,
    matched: Boolean(match),
    sessionId: chatSession.id,
  });
}
