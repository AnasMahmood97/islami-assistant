import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.accreditedCompany.findMany({ orderBy: { name: "asc" } });
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "companies");
  const file = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=approved-companies.xlsx",
    },
  });
}
