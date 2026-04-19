import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED: Record<string, string> = {
  login: "login.jpeg",
  header: "The head of the page.jpg",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const fileName = ALLOWED[name];
  if (!fileName) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "..", fileName);
  try {
    const file = await fs.readFile(filePath);
    const contentType = fileName.endsWith(".jpg")
      ? "image/jpeg"
      : "image/jpeg";
    return new NextResponse(file, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Asset missing" }, { status: 404 });
  }
}
