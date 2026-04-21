"use client";

import { ReactNode } from "react";

type AdminSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function AdminSection({ title, children, className = "" }: AdminSectionProps) {
  return (
    <section className={`chat-pane ${className}`.trim()}>
      <h2 className="mb-4 text-xl font-bold text-[#b65600]">{title}</h2>
      {children}
    </section>
  );
}
