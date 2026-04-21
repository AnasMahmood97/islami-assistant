import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const DEFAULTS = [
  { routeKey: "chat", label: "المحادثة", text: "كيف يمكنني مساعدتك اليوم؟" },
  { routeKey: "finance", label: "التمويلات", text: "جاهز لاحتساب معاملة جديدة؟ لا تنسَ إرسال فرصة بيعية." },
  { routeKey: "cards", label: "البطاقات", text: "برأيك، أي بطاقة هي الأنسب لعملائنا اليوم؟" },
  { routeKey: "accounts", label: "الحسابات", text: "ما هو نوع الحساب الأكثر طلباً في فرعك؟" },
  { routeKey: "offers", label: "العروض", text: "أي عرض نستطيع طرحه الآن بما يناسب العميل؟" },
  { routeKey: "products", label: "المنتجات", text: "هل نحتاج إبراز منتج محدد اليوم؟" },
  { routeKey: "directory", label: "الفروع والصرافات", text: "ابحث بسرعة عن الفرع أو الصراف الأقرب." },
  { routeKey: "phones", label: "الهواتف", text: "اختر المحافظة وسأساعدك في الوصول للرقم المطلوب." },
  { routeKey: "links", label: "الروابط واليوزرات", text: "لا تنس تحديث بيانات المنظومات الخاصة بك." },
  { routeKey: "correspondence", label: "المراسلات", text: "هل ترغب بقالب بريد جاهز للنسخ والإرسال؟" },
  { routeKey: "settings", label: "الإعدادات", text: "من هنا يمكنك تعديل الاسم وكلمة السر." },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.assistantThought.findMany({ orderBy: { routeKey: "asc" } });
  if (rows.length > 0) return NextResponse.json(rows);
  return NextResponse.json(DEFAULTS);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const rows = Array.isArray(body?.rows) ? body.rows : [];

  for (const row of rows) {
    if (!row?.routeKey || !row?.text || !row?.label) continue;
    await prisma.assistantThought.upsert({
      where: { routeKey: String(row.routeKey) },
      create: { routeKey: String(row.routeKey), label: String(row.label), text: String(row.text) },
      update: { label: String(row.label), text: String(row.text) },
    });
  }

  const updated = await prisma.assistantThought.findMany({ orderBy: { routeKey: "asc" } });
  return NextResponse.json(updated);
}
