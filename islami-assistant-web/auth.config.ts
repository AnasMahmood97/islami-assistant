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
          token.id = String((user as { id?: unknown }).id ?? token.sub ?? "");
          token.username = String((user as { username?: unknown }).username ?? "");
        }
        if (String(token.username ?? "").toLowerCase() === "anas@admin.com") {
          token.role = "ADMIN";
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
          const tokenUsername = String(token.username ?? "").toLowerCase();
          const forcedRole = tokenUsername === "anas@admin.com" ? "ADMIN" : String(token.role ?? "EMPLOYEE");
          session.user.id = String(token.id ?? token.sub ?? "");
          session.user.role = forcedRole;
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
