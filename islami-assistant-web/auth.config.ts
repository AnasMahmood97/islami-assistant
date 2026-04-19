import type { NextAuthConfig } from "next-auth";
import { resolveAuthSecret } from "@/lib/auth-secret";

/**
 * إعدادات مشتركة بين خادم التطبيق و middleware (بدون Prisma في هذه الوحدة).
 */
export const nextAuthShared: Omit<NextAuthConfig, "providers"> = {
  trustHost: true,
  secret: resolveAuthSecret(),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.role = String((user as { role?: unknown }).role ?? "EMPLOYEE");
          token.username = String((user as { username?: unknown }).username ?? "");
        }
        return token;
      } catch (e) {
        console.error("[auth] jwt callback:", e);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.sub ?? "";
          session.user.role = String(token.role ?? "EMPLOYEE");
          session.user.username = String(token.username ?? "");
        }
        return session;
      } catch (e) {
        console.error("[auth] session callback:", e);
        return session;
      }
    },
  },
};
