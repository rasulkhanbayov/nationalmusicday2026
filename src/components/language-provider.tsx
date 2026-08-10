"use client";

import { createContext, useContext, useState, useCallback } from "react";
import {
  type Locale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getDict,
  formatPrice,
  formatDateLong,
} from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: ReturnType<typeof getDict>;
  price: (cents: number) => string;
  dateLong: (d: Date | string) => string;
  /**
   * Picks the English variant when the visitor is reading English and a
   * translation exists; otherwise falls back to the primary-language value.
   * Used for organiser-authored content stored on the Event row.
   */
  content: (base: string | null | undefined, en?: string | null) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    // Persist for a year so the choice survives navigation and return visits.
    document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    // Keep the document language in sync for screen readers and browsers.
    document.documentElement.lang = l;
  }, []);

  const value: LanguageContextValue = {
    locale,
    setLocale,
    t: getDict(locale),
    price: (cents) => formatPrice(cents, locale),
    dateLong: (d) => formatDateLong(typeof d === "string" ? new Date(d) : d, locale),
    content: (base, en) =>
      (locale === "en" ? en?.trim() || base : base) ?? "",
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Defensive fallback so a stray component outside the provider renders
    // readable text instead of crashing the page.
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: getDict(DEFAULT_LOCALE),
      price: (c) => formatPrice(c, DEFAULT_LOCALE),
      dateLong: (d) =>
        formatDateLong(typeof d === "string" ? new Date(d) : d, DEFAULT_LOCALE),
      content: (base) => base ?? "",
    };
  }
  return ctx;
}
