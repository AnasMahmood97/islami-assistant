export function sanitizeKnowledgeImageUrl(pathValue?: string | null) {
  const raw = String(pathValue ?? "").trim();
  if (!raw) return null;

  const lowered = raw.toLowerCase();
  const invalidLiterals = new Set(["1", "undefined", "null", "knowledge preview"]);
  if (invalidLiterals.has(lowered) || /^\d+$/.test(raw)) return null;

  let normalized = raw.replace(/\\/g, "/");
  if (normalized.startsWith("public/")) {
    normalized = normalized.slice("public/".length);
  }
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://") && !normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  const imagePathPattern = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?(#.*)?$/i;
  if (!imagePathPattern.test(normalized) || /\s/.test(normalized)) return null;

  return normalized;
}
