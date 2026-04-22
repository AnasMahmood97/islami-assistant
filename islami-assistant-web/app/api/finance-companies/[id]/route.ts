import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EDITABLE_FIELDS = new Set([
  "name",
  "notes",
  "category",
  "profitRateInfo",
  "expiryDate",
  "murabaha_1_4",
  "murabaha_5_7",
  "murabaha_8_10",
  "murabaha_un_1_4",
  "murabaha_un_5_7",
  "murabaha_un_8_10",
  "ijara_1_7",
  "ijara_8_15",
  "ijara_15_20",
  "ijara_21_25",
  "ijara_un_1_7",
  "ijara_un_8_15",
  "ijara_un_15_20",
  "ijara_un_21_25",
  "stocks_1_4",
  "stocks_5_7",
  "stocks_8_10",
  "stocks_un_1_4",
  "stocks_un_5_7",
  "stocks_un_8_10",
]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  const entries = Object.entries(body).filter(([key]) => EDITABLE_FIELDS.has(key));
  if (entries.length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  }

  const updateData: Record<string, string | null> = {};
  for (const [key, value] of entries) {
    const nextValue = String(value ?? "").trim();
    if (key === "name" && !nextValue) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updateData[key] = nextValue || null;
  }

  const updated = await prisma.accreditedCompany.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
