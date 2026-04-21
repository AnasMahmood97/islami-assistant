export type NavItem = { href: string; label: string };

export type NavGroup = {
  id: string;
  label: string;
  href?: string;
  adminOnly?: boolean;
  children?: NavItem[];
};

export const navGroups: NavGroup[] = [
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
    label: "روابط",
    href: "/links",
  },
  { id: "creds", label: "يوزرات", href: "/credentials" },
  {
    id: "phones",
    label: "هواتف",
    href: "/phones",
  },
  { id: "correspondence", label: "مراسلات", href: "/correspondence" },
  { id: "settings", label: "الإعدادات", href: "/settings" },
  {
    id: "memory",
    label: "ذاكرة الذكاء الاصطناعي",
    href: "/admin/memory",
    adminOnly: true,
  },
  { id: "thoughts", label: "ماذا يفعل المساعد الآن؟", href: "/admin/thoughts", adminOnly: true },
];
