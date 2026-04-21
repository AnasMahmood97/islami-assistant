import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const tmp = path.join(os.tmpdir(), `knowledge-${Date.now()}.xlsx`);
  await fs.writeFile(tmp, buffer);

  try {
    let items: Array<{ question: string; answer: string; keywords?: string | null; imageRef?: string | null }> = [];
    try {
      const py = await execFileAsync("python", [path.join(process.cwd(), "scripts", "extract_knowledge.py"), tmp]);
      items = JSON.parse(py.stdout).items ?? [];
    } catch {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      items = rows
        .map((r) => ({
          question: String(r["سؤال"] ?? r["السؤال"] ?? r["question"] ?? ""),
          answer: String(r["جواب"] ?? r["الجواب"] ?? r["answer"] ?? ""),
          keywords: String(r["كلمات مفتاحية"] ?? r["keywords"] ?? ""),
        }))
        .filter((r) => r.question && r.answer);
    }

    if (items.length) {
      await prisma.knowledgeItem.createMany({
        data: items.map((item) => ({
          question: item.question,
          answer: item.answer,
          keywords: item.keywords || null,
          imageUrl: item.imageRef ? `/api/knowledge/images/${item.imageRef}` : null,
        })),
      });
    }
    return NextResponse.json({ imported: items.length });
  } finally {
    await fs.unlink(tmp).catch(() => undefined);
  }
}
