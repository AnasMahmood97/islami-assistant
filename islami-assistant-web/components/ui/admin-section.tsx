"use client";

import { ReactNode } from "react";

type AdminSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function AdminSection({ title, children, className = "" }: AdminSectionProps) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ${className}`.trim()}>
      <h2 className="mb-4 text-xl font-bold text-[#9e1b1f]">{title}</h2>
      {children}
    </section>
  );
}
