/**
 * يجب أن يطابق سر التوقيع المستخدم في NextAuth وفي middleware (getToken).
 * في التطوير: قيمة افتراضية إن لم تُضبط المتغيرات (تجنب فشل الجلسة).
 */
const DEV_FALLBACK = "dev-only-auth-secret-min-32-characters-do-not-use-in-prod";

export function resolveAuthSecret(): string | undefined {
  const s =
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    (process.env.NODE_ENV !== "production" ? DEV_FALLBACK : "");
  return s || undefined;
}
