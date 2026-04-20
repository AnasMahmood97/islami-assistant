"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        const theme = me?.theme === "dark" ? "dark" : "light";
        const language = me?.language === "en" ? "en" : "ar";
        document.documentElement.lang = language;
        document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
        document.documentElement.classList.toggle("dark", theme === "dark");
      })
      .catch(() => undefined);
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
