import { auth } from "@/auth";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
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
  const mimeIsImage = file.type.startsWith("image/");
  const extIsAllowed = ALLOWED_IMAGE_EXTENSIONS.has(ext);
  if (!extIsAllowed && !mimeIsImage) {
    return NextResponse.json({ error: "يرجى رفع صورة فقط (jpg/png/webp/gif)" }, { status: 400 });
  }
  const safeExt = extIsAllowed ? ext : ".jpg";

  try {
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`;
    const dir = path.join(process.cwd(), "public", "uploads", "avatars");
    // Ensure destination exists on every upload attempt.
    mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, name);
    const data = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, data);
    return NextResponse.json({ url: `/uploads/avatars/${name}` });
  } catch (error) {
    console.error("[api/uploads] avatar upload failed", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cwd: process.cwd(),
      targetDir: path.join(process.cwd(), "public", "uploads", "avatars"),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      extension: ext,
    });
    return NextResponse.json(
      {
        error: "تعذر حفظ الصورة على الخادم. تأكد من صلاحيات الكتابة لمسار public/uploads/avatars.",
      },
      { status: 500 },
    );
  }
}
