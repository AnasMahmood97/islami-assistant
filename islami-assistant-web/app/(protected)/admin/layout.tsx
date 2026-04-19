import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/chat");
  return children;
}
