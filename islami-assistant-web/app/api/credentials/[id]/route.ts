import { auth } from "@/auth";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const existing = await prisma.credentialEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "ADMIN" && existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hasPassword = body.password != null;
  const enc = hasPassword ? encryptSecret(String(body.password)) : null;

  const row = await prisma.credentialEntry.update({
    where: { id },
    data: {
      ...(body.username != null ? { username: String(body.username) } : {}),
      ...(enc
        ? {
            passwordCiphertext: enc.ciphertext,
            passwordIv: enc.iv,
            passwordTag: enc.tag,
          }
        : {}),
      ...(session.user.role === "ADMIN" && body.system != null ? { system: String(body.system) } : {}),
    },
  });
  return NextResponse.json({ id: row.id, system: row.system, username: row.username });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.credentialEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "ADMIN" && existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.credentialEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
