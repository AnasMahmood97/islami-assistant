import { auth } from "@/auth";
import { greetUserLine } from "@/lib/greeting";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function normalize(text: string) {
  return text.toLowerCase().trim();
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const question = String(body.question ?? "").trim();
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
  const match =
    knowledge.find((item) => qNorm.includes(normalize(item.question))) ||
    knowledge.find((item) => normalize(item.answer).includes(qNorm)) ||
    knowledge.find((item) => (item.keywords ?? "").split(",").some((k) => qNorm.includes(normalize(k))));

  await prisma.chatMessage.create({
    data: { sessionId: chatSession.id, role: "user", text: question },
  });

  const fallback =
    "أنا ذكاء اصطناعي مخصص فقط لمساعدتك في استفسارات تتعلق بالبنك، ولا يمكنني الإجابة عن أي موضوع خارج الملف المعتمد حاليًا.";

  const userLabel = session.user?.name ?? "موظف";
  const reply = match
    ? `${greetUserLine(userLabel)}.\n\n${match.answer.trim()}`
    : fallback;
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
    imageUrl: match?.imageUrl ?? null,
    matched: Boolean(match),
    sessionId: chatSession.id,
  });
}
