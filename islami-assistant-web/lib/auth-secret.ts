/**
 * يجب أن يطابق سر التوقيع المستخدم في NextAuth (JWT).
 * يُفضّل ضبط AUTH_SECRET أو NEXTAUTH_SECRET في الإنتاج؛ القيمة الاحتياطية تمنع
 * MissingSecret فقط ولا تُستخدم كبديل أمني طويل الأمد.
 */
const DEV_FALLBACK = "dev-only-auth-secret-min-32-characters-do-not-use-in-prod";
const PROD_FALLBACK = "a-long-fallback-secret-for-production-stability-32-chars";

export function resolveAuthSecret(): string {
  const s =
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (s) return s;

  if (process.env.NODE_ENV !== "production") {
    return DEV_FALLBACK;
  }

  return PROD_FALLBACK;
}
