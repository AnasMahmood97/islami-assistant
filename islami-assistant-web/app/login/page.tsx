import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { loginAction } from "./actions";

const LOGIN_HEADER_IMAGE = "/data/The%20head%20of%20the%20page.jpg";

const errorMessages: Record<string, string> = {
  credentials: "اسم المستخدم أو كلمة المرور غير صحيحة، أو تعذر الاتصال بقاعدة البيانات.",
  CredentialsSignin: "اسم المستخدم أو كلمة المرور غير صحيحة، أو تعذر الاتصال بقاعدة البيانات.",
  callback:
    "تعذر إكمال تسجيل الدخول (إعدادات الجلسة أو قاعدة البيانات). تأكد من وجود AUTH_SECRET في ملف .env واتصال MongoDB، ثم أعد المحاولة.",
  unknown: "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/chat");

  const { error } = await searchParams;
  const errorText = error ? errorMessages[error] ?? errorMessages.unknown : null;

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      {/* لوحة بصرية ثابتة — ليست «خلفية» شفافة؛ تصميم كامل كما في بوابات الدخول */}
      <div className="relative hidden lg:flex lg:w-[46%] min-h-[220px] flex-col justify-between p-10 text-white overflow-hidden bg-[#7a1519]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/login-hero.svg')" }}
        />
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/85 tracking-wide">مساعد البنك الإسلامي</p>
          <h2 className="mt-3 text-3xl font-bold leading-snug max-w-md">
            بوابة الموظفين
          </h2>
          <p className="mt-4 text-sm text-white/80 max-w-sm leading-relaxed">
            تسجيل دخول آمن للوصول إلى المساعد الذكي والأدوات الداخلية.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs text-white/60">
          <span className="h-px flex-1 max-w-[4rem] bg-white/25" />
          <span>Islamic Banking Assistant</span>
        </div>
      </div>

      {/* الجانب الأبيض: صورة الرأس في أقصى زاوية اليمين + البطاقة */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6 pt-10 lg:p-10 lg:pt-14">
        <div className="pointer-events-none absolute right-4 top-4 z-20 max-w-[min(92vw,280px)] sm:right-6 sm:top-6 lg:right-8 lg:top-8">
          <img
            src={LOGIN_HEADER_IMAGE}
            alt=""
            className="h-auto max-h-28 w-auto max-w-full rounded-lg border border-slate-200/90 bg-white object-contain object-top shadow-md sm:max-h-32"
          />
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 pt-10 shadow-xl shadow-slate-200/60 sm:pt-12">
            <h1 className="text-2xl font-bold text-[#9e1b1f]">تسجيل الدخول</h1>
            <p className="mt-1 text-sm text-slate-600">أدخل بيانات حسابك للمتابعة</p>

            {errorText ? (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {errorText}
              </div>
            ) : null}

            <form action={loginAction} className="mt-6 space-y-4">
              <div>
                <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
                  اسم المستخدم
                </label>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="مثال: admin"
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  كلمة المرور
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#9e1b1f] py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#85161a] focus:outline-none focus:ring-2 focus:ring-[#ef7d00] focus:ring-offset-2"
              >
                دخول
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
