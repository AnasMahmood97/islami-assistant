import { auth } from "@/auth";
import { uploadFinanceFileToCloudinary } from "@/lib/cloudinary";
import { NextResponse } from "next/server";
import path from "node:path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".pdf"]);
const MAX_FILE_SIZE_MB = 10;

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file is not allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Max file size is ${MAX_FILE_SIZE_MB}MB` }, { status: 400 });
  }

  const ext = path.extname(file.name || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Unsupported file type. Allowed: jpg, jpeg, png, pdf" }, { status: 400 });
  }

  try {
    const uploaded = await uploadFinanceFileToCloudinary(file);
    return NextResponse.json({ path: uploaded.secureUrl, fileType: uploaded.kind });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
