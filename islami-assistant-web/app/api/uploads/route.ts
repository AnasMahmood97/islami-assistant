import { auth } from "@/auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MAX_MB = 5;
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Max size is ${MAX_MB}MB` }, { status: 400 });
  }

  const ext = path.extname(file.name || "").toLowerCase() || ".bin";
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "يرجى رفع صورة فقط (jpg/png/webp/gif)" }, { status: 400 });
  }
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, name);
  const data = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, data);
  return NextResponse.json({ url: `/uploads/avatars/${name}` });
}
