import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prisma schema currently uses approvedCompany for accredited companies data.
  await prisma.approvedCompany.deleteMany({});
  return NextResponse.json({ ok: true });
}
