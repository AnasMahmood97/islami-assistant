"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type ThoughtRow = { routeKey: string; label: string; text: string };

const DEFAULT_THOUGHTS: Record<string, string> = {
  chat: "كيف يمكنني مساعدتك اليوم؟",
  finance: "جاهز لاحتساب معاملة جديدة؟ لا تنسَ إرسال فرصة بيعية.",
  cards: "برأيك، أي بطاقة هي الأنسب لعملائنا اليوم؟",
  accounts: "ما هو نوع الحساب الأكثر طلباً في فرعك؟",
  offers: "هل لدينا عرض مناسب يمكن اقتراحه الآن؟",
  products: "أي منتج يمكن أن يرفع قيمة تجربة العميل اليوم؟",
  directory: "هل تريد الوصول السريع للفرع أو الصراف المناسب؟",
  phones: "اختر المحافظة وسأساعدك في أسرع وصول للرقم المطلوب.",
  links: "لا تنس حفظ روابطك ومنظوماتك المفضلة.",
  correspondence: "هل تحتاج قالب مراسلة جاهز للإرسال الآن؟",
  settings: "يمكنك تحديث بياناتك من هنا بكل سهولة.",
};

function resolveRouteKey(pathname: string): string {
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/catalog/cards")) return "cards";
  if (pathname.startsWith("/catalog/accounts")) return "accounts";
  if (pathname.startsWith("/catalog/offers")) return "offers";
  if (pathname.startsWith("/catalog/products")) return "products";
  if (pathname.startsWith("/directory")) return "directory";
  if (pathname.startsWith("/phones")) return "phones";
  if (pathname.startsWith("/links") || pathname.startsWith("/credentials")) return "links";
  if (pathname.startsWith("/correspondence")) return "correspondence";
  if (pathname.startsWith("/settings")) return "settings";
  return "chat";
}

export function AssistantAvatarPanel() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [avatarId, setAvatarId] = useState(1);
  const [thoughts, setThoughts] = useState<ThoughtRow[]>([]);
  const routeKey = useMemo(() => resolveRouteKey(pathname), [pathname]);

  useEffect(() => {
    const tid = window.setTimeout(() => {
      setAvatarId(Math.floor(Math.random() * 50) + 1);
    }, 0);
    return () => window.clearTimeout(tid);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/assistant-thoughts")
      .then((r) => r.json())
      .then((rows) => setThoughts(Array.isArray(rows) ? rows : []))
      .catch(() => setThoughts([]));
  }, []);

  const sourceText = thoughts.find((x) => x.routeKey === routeKey)?.text ?? DEFAULT_THOUGHTS[routeKey] ?? DEFAULT_THOUGHTS.chat;
  const thoughtPool = sourceText.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const thought = thoughtPool.length > 0 ? thoughtPool[avatarId % thoughtPool.length] : sourceText;

  return (
    <aside className="col-span-2 hidden lg:flex flex-col items-center justify-center gap-4 px-2">
      <div className="glass-card relative max-w-[220px] p-3">
        <p className="rounded-2xl border border-[#E60000]/20 bg-white px-3 py-2 text-sm text-[#7a0b0b]">{thought}</p>
        {isAdmin ? (
          <Link href="/admin/thoughts" className="mt-2 inline-block text-xs text-[#E60000] underline">
            ماذا يفعل المساعد الآن؟
          </Link>
        ) : null}
      </div>
      <motion.img
        key={avatarId}
        src={`/avatars/${avatarId}.png`}
        alt="Islami assistant avatar"
        className="h-[300px] w-auto object-contain drop-shadow-[0_14px_20px_rgba(255,127,0,0.25)]"
        animate={{ y: [0, -10, 0], rotate: [0, 1.6, 0, -1.6, 0], scale: [1, 1.02, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        onError={(event) => {
          const target = event.currentTarget as HTMLImageElement;
          target.src = "/avatars/1.png";
        }}
      />
    </aside>
  );
}
