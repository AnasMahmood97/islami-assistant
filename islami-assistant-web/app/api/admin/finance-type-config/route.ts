import { auth } from "@/auth";
import { uploadFinanceFileToCloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function withAliases<T extends { imageUrl?: string | null; pdfUrl?: string | null }>(row: T) {
  return {
    ...row,
    imagePath: row.imageUrl ?? null,
    pdfPath: row.pdfUrl ?? null,
  };
}

async function upsertConfig(body: {
  financeType: string;
  label?: string | null;
  imagePath?: string | null;
  pdfPath?: string | null;
}) {
  const row = await prisma.financeTypeConfig.upsert({
    where: { financeType: body.financeType },
    create: {
      financeType: body.financeType,
      label: body.label ?? null,
      imageUrl: body.imagePath ?? null,
      pdfUrl: body.pdfPath ?? null,
    },
    update: {
      label: body.label ?? undefined,
      imageUrl: body.imagePath ?? undefined,
      pdfUrl: body.pdfPath ?? undefined,
    },
  });
  return withAliases(row);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.financeTypeConfig.findMany();
  return NextResponse.json(rows.map(withAliases));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const financeType = String(formData.get("financeType") ?? "").trim();
    if (!financeType) return NextResponse.json({ error: "financeType required" }, { status: 400 });

    const labelRaw = formData.get("label");
    const currentImageRaw = formData.get("imagePath");
    const currentPdfRaw = formData.get("pdfPath");
    const imageFile = formData.get("imageFile");
    const pdfFile = formData.get("pdfFile");

    let imagePath = currentImageRaw ? String(currentImageRaw) : null;
    let pdfPath = currentPdfRaw ? String(currentPdfRaw) : null;

    if (imageFile instanceof File && imageFile.size > 0) {
      const uploaded = await uploadFinanceFileToCloudinary(imageFile);
      imagePath = uploaded.secureUrl;
    }

    if (pdfFile instanceof File && pdfFile.size > 0) {
      const uploaded = await uploadFinanceFileToCloudinary(pdfFile);
      pdfPath = uploaded.secureUrl;
    }

    const row = await upsertConfig({
      financeType,
      label: labelRaw != null ? String(labelRaw) : null,
      imagePath,
      pdfPath,
    });
    return NextResponse.json(row);
  }

  const body = await request.json();
  const financeType = String(body.financeType ?? "").trim();
  if (!financeType) return NextResponse.json({ error: "financeType required" }, { status: 400 });

  const nextImage = body.imagePath !== undefined ? body.imagePath : body.imageUrl;
  const nextPdf = body.pdfPath !== undefined ? body.pdfPath : body.pdfUrl;
  const row = await upsertConfig({
    financeType,
    label: body.label !== undefined ? (body.label ? String(body.label) : null) : undefined,
    imagePath: nextImage !== undefined ? (nextImage ? String(nextImage) : null) : undefined,
    pdfPath: nextPdf !== undefined ? (nextPdf ? String(nextPdf) : null) : undefined,
  });
  return NextResponse.json(row);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const financeType = new URL(request.url).searchParams.get("financeType");
  if (!financeType) return NextResponse.json({ error: "financeType required" }, { status: 400 });
  await prisma.financeTypeConfig.deleteMany({ where: { financeType } });
  await prisma.financeRate.deleteMany({ where: { financeType } });
  return NextResponse.json({ ok: true });
}
