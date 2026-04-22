import { auth } from "@/auth.edge";
import { NextResponse } from "next/server";

/**
 * يستخدم نفس مسار الجلسة الذي يعتمد عليه auth() في الخادم (وليس getToken على Edge
 * بسر قد يكون فارغاً إذا لم يُحقن AUTH_SECRET وقت البناء).
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Enforce admin-only access for all /admin routes at middleware level.
  if (pathname.startsWith("/admin") && req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
