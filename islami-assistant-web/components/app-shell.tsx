"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type NavGroup = {
  id: string;
  label: string;
  href?: string;
  adminOnly?: boolean;
  children?: { href: string; label: string }[];
};

const navGroups: NavGroup[] = [
  { id: "chat", label: "المحادثة", href: "/chat" },
  {
    id: "finance",
    label: "التمويلات",
    children: [
      { href: "/finance/calculate", label: "احتساب معاملة" },
      { href: "/finance/companies", label: "الشركات المعتمدة" },
    ],
  },
  { id: "accounts", label: "الحسابات", href: "/catalog/accounts" },
  { id: "cards", label: "البطاقات", href: "/catalog/cards" },
  { id: "offers", label: "العروض", href: "/catalog/offers" },
  { id: "products", label: "المنتجات", href: "/catalog/products" },
  {
    id: "places",
    label: "الفروع والصرافات",
    children: [
      { href: "/directory/branches", label: "الفروع" },
      { href: "/directory/atms", label: "الصرافات" },
    ],
  },
  {
    id: "links",
    label: "روابط ويوزرات",
    children: [
      { href: "/links?tab=links", label: "روابط" },
      { href: "/links?tab=creds", label: "يوزرات" },
    ],
  },
  {
    id: "phones",
    label: "هواتف ومراسلات",
    children: [
      { href: "/phones?tab=phones", label: "هواتف" },
      { href: "/phones?tab=mail", label: "مراسلات" },
    ],
  },
  { id: "settings", label: "الإعدادات", href: "/settings" },
  {
    id: "memory",
    label: "ذاكرة الذكاء الاصطناعي",
    href: "/admin/memory",
    adminOnly: true,
  },
];

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/pending-count")
      .then((r) => r.json())
      .then((d) => setPending(d.count ?? 0))
      .catch(() => undefined);
  }, [isAdmin, pathname]);

  const matchPath = (href: string) => {
    const [base, query] = href.split("?");
    if (pathname !== base && !pathname.startsWith(base + "/")) return false;
    if (!query) return true;
    const want = new URLSearchParams(query);
    for (const [k, v] of want.entries()) {
      if (searchParams.get(k) !== v) return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-[#f5f0ea]">
      <header className="border-b border-[#9e1b1f]/20 bg-[#9e1b1f]">
        <img src="/header.jpg" alt="" className="h-24 w-full object-cover object-center" />
      </header>
      <div className="grid min-h-[calc(100vh-96px)] grid-cols-12">
        <aside className="col-span-3 border-l border-[#ef7d00]/30 bg-[#ef7d00]/15 p-4">
          <p className="mb-4 rounded-lg bg-white p-3 text-sm shadow-sm">أهلًا، {userName}</p>
          <nav className="space-y-1">
            {navGroups.map((g) => {
              if (g.adminOnly && !isAdmin) return null;
              if (g.href && !g.children) {
                const active = matchPath(g.href);
                return (
                  <Link
                    key={g.id}
                    href={g.href}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      active ? "bg-[#9e1b1f] text-white" : "bg-white text-slate-700 hover:bg-[#ef7d00]/25"
                    }`}
                  >
                    {g.label}
                    {g.id === "memory" && pending > 0 ? (
                      <span className="mr-2 inline-flex min-w-[1.25rem] justify-center rounded-full bg-white px-1 text-xs text-[#9e1b1f]">
                        {pending}
                      </span>
                    ) : null}
                  </Link>
                );
              }
              const expanded =
                open[g.id] ?? g.children?.some((c) => matchPath(c.href)) ?? false;
              return (
                <div key={g.id} className="rounded-lg bg-white/80">
                  <button
                    type="button"
                    onClick={() => setOpen((s) => ({ ...s, [g.id]: !expanded }))}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-slate-800"
                  >
                    {g.label}
                    <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded ? (
                    <div className="space-y-1 border-t border-[#ef7d00]/20 px-2 pb-2 pt-1">
                      {g.children?.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className={`block rounded-md px-2 py-1.5 text-sm ${
                            matchPath(c.href)
                              ? "bg-[#9e1b1f] text-white"
                              : "text-slate-600 hover:bg-[#ef7d00]/20"
                          }`}
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white"
          >
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </aside>
        <main className="col-span-9 bg-[#faf8f5] p-6">{children}</main>
      </div>
    </div>
  );
}
