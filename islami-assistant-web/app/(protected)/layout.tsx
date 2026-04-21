import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fff3e7] p-6 text-center text-slate-500">جاري التحميل…</div>}>
      <AppShell userName={session.user.name ?? "موظف"}>{children}</AppShell>
    </Suspense>
  );
}
