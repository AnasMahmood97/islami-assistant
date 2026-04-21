import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.financeRate.deleteMany({});
  console.log("Cleared FinanceRate collection successfully.");
} catch (error) {
  console.error("Failed to clear FinanceRate collection:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
