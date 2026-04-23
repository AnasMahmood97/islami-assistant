export function getPublicUrl(pathValue?: string | null) {
  const raw = String(pathValue ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  let normalized = raw.replace(/\\/g, "/");
  if (normalized.startsWith("public/")) {
    normalized = normalized.slice("public".length);
  }
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  return normalized;
}
