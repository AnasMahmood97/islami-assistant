import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { nextAuthShared } from "@/auth.config";

/**
 * نسخة خفيفة لـ NextAuth لـ middleware فقط — بدون استيراد Prisma (لا يعمل على Edge).
 * يجب أن تبقى jwt/session callbacks و secret مطابقة لـ auth.ts.
 */
const { auth } = NextAuth({
  ...nextAuthShared,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { username: {}, password: {} },
      async authorize() {
        return null;
      },
    }),
  ],
});

export { auth };
