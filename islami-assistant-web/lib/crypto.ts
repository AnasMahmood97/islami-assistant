import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY is required");
  }
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptSecret(payload: { ciphertext: string; iv: string; tag: string }): string {
  const decipher = crypto.createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const result = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);
  return result.toString("utf8");
}
