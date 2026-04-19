import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin",
      username: "admin",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
