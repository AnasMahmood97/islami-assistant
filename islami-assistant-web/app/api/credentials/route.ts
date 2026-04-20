import { auth } from "@/auth";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.credentialEntry.findMany({
    where: session.user.role === "ADMIN" ? undefined : { userId: session.user.id },
    orderBy: { system: "asc" },
    include: { systemDef: true },
  });
  return NextResponse.json(
    rows.map((row) => ({
      id: row.id,
      system: row.system,
      systemId: row.systemId,
      systemLink: row.systemDef?.linkUrl ?? null,
      username: row.username,
      password: decryptSecret({
        ciphertext: row.passwordCiphertext,
        iv: row.passwordIv,
        tag: row.passwordTag,
      }),
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const userId =
    session.user.role === "ADMIN" && body.userId ? String(body.userId) : session.user.id;
  const systemName = String(body.system ?? "").trim();
  const password = String(body.password ?? "");
  if (!systemName || !password) {
    return NextResponse.json({ error: "system and password are required" }, { status: 400 });
  }
  const enc = encryptSecret(password);
  const systemDef = await prisma.systemDefinition.findFirst({ where: { name: systemName } });
  const row = await prisma.credentialEntry.create({
    data: {
      userId,
      systemId: systemDef?.id,
      system: systemName,
      username: String(body.username ?? ""),
      passwordCiphertext: enc.ciphertext,
      passwordIv: enc.iv,
      passwordTag: enc.tag,
    },
  });
  return NextResponse.json({
    id: row.id,
    system: row.system,
    username: row.username,
    password,
  });
}
