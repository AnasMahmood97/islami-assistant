"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.documentElement.classList.remove("dark");
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
