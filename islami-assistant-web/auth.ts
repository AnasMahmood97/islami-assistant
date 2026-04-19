import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveAuthSecret } from "@/lib/auth-secret";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: {},
        password: {},
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { username: parsed.data.username },
          });
          if (!user) return null;

          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!valid) return null;

          return {
            id: String(user.id),
            name: user.name ?? "",
            role: String(user.role),
            username: user.username,
          };
        } catch (e) {
          console.error("[auth] authorize failed:", e);
          return null;
        }
      },
    }),
  ],
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
});
