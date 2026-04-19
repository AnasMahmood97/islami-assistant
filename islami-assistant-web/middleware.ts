import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveAuthSecret } from "@/lib/auth-secret";

/**
 * يعمل على Edge — لا يستورد Prisma (غير مدعوم على Edge).
 * الجلسة JWT تُتحقق عبر AUTH_SECRET نفسه المستخدم في NextAuth.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (/\.\w+$/.test(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: resolveAuthSecret(),
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
