import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const EDITABLE_FIELDS = new Set(["name", "city", "address", "phone", "postalCode", "workingHours", "notes"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type, id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const existing = await prisma.branchAtmEntry.findFirst({ where: { id, type } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!EDITABLE_FIELDS.has(key)) continue;
    const normalized = String(value ?? "").trim();
    if (key === "name" && !normalized) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updateData[key] = normalized || null;
  }

  const updated = await prisma.branchAtmEntry.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(updated);
}
