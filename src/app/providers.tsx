"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/components/language-provider";
import type { Locale } from "@/lib/i18n";

export function Providers({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LanguageProvider initialLocale={locale}>
        {children}
        <Toaster />
      </LanguageProvider>
    </SessionProvider>
  );
}
