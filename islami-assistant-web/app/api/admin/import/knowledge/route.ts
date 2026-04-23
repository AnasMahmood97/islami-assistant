import { auth } from "@/auth";
import { sanitizeKnowledgeImageUrl } from "@/lib/knowledge-image-url";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";

type ImportedItem = { question: string; answer: string; keywords?: string | null; imageUrl?: string | null };

function cleanCell(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value: unknown) {
  return cleanCell(value).toLowerCase();
}

function normalizeImportedItem(item: ImportedItem): ImportedItem | null {
  const question = cleanCell(item.question);
  const answer = cleanCell(item.answer);
  const keywords = cleanCell(item.keywords ?? "");
  const imageUrlRaw = cleanCell(item.imageUrl ?? "");
  const looksLikeLocalDiskPath = /^[a-zA-Z]:[\\/]/.test(imageUrlRaw);
  if (looksLikeLocalDiskPath) {
    console.warn("[knowledge-import] Ignoring local disk image path", { imageUrlRaw, question });
  }
  const imageUrl = looksLikeLocalDiskPath ? null : sanitizeKnowledgeImageUrl(imageUrlRaw);
  if (!question || !answer) return null;
  return {
    question,
    answer,
    keywords: keywords || null,
    imageUrl,
  };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });

  if (!rawRows.length) {
    return NextResponse.json({ imported: 0, skipped: 0 });
  }

  const headerRowIndex = rawRows.findIndex((row) => row.some((cell) => cleanCell(cell)));
  if (headerRowIndex < 0) {
    return NextResponse.json({ imported: 0, skipped: 0 });
  }

  const headerRow = rawRows[headerRowIndex] ?? [];
  const headerMap = new Map<string, number>();
  headerRow.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    if (normalized) headerMap.set(normalized, index);
  });

  const questionIndex = headerMap.get("سؤال") ?? headerMap.get("السؤال") ?? headerMap.get("question") ?? 0;
  const answerIndex = headerMap.get("الجواب") ?? headerMap.get("جواب") ?? headerMap.get("answer") ?? 1;
  const keywordsIndex = headerMap.get("كلمات مفتاحيه") ?? headerMap.get("كلمات مفتاحية") ?? headerMap.get("keywords") ?? 2;
  const imageUrlIndex = headerMap.get("رابط الصورة") ?? headerMap.get("رابط الصوره") ?? headerMap.get("imageurl") ?? 3;

  const parsed: ImportedItem[] = [];
  let skipped = 0;
  for (const row of rawRows.slice(headerRowIndex + 1)) {
    const question = cleanCell(row[questionIndex]);
    const answer = cleanCell(row[answerIndex]);
    const keywords = cleanCell(row[keywordsIndex]);
    const imageUrl = cleanCell(row[imageUrlIndex]);

    const item = normalizeImportedItem({ question, answer, keywords, imageUrl });
    if (!item) {
      const hasAnyData = row.some((cell) => cleanCell(cell));
      if (hasAnyData) skipped += 1;
      continue;
    }
    parsed.push(item);
  }

  if (parsed.length) {
    await prisma.knowledgeItem.createMany({
      data: parsed.map((item) => ({
        question: item.question,
        answer: item.answer,
        keywords: item.keywords || null,
        imageUrl: item.imageUrl || null,
      })),
    });
  }
  return NextResponse.json({ imported: parsed.length, skipped });
}
