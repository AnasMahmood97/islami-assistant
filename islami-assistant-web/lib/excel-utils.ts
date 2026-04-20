import * as XLSX from "xlsx";

export function cleanCell(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function normalizeArabicKey(value: unknown): string {
  return cleanCell(value).replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/\s+/g, "");
}

export function findHeaderIndex(headers: string[], aliases: string[]): number {
  const normalizedHeaders = headers.map((h) => normalizeArabicKey(h));
  const normalizedAliases = aliases.map((a) => normalizeArabicKey(a));
  for (let i = 0; i < normalizedHeaders.length; i += 1) {
    const h = normalizedHeaders[i];
    if (!h) continue;
    if (normalizedAliases.some((a) => h === a || h.includes(a) || a.includes(h))) {
      return i;
    }
  }
  return -1;
}

export function sheetTo2dRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
}
