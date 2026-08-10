"use client";

import { Languages } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { cn } from "@/lib/utils";

/**
 * Compact EN | DE toggle. Switching is instant (client-side state) and the
 * choice is stored in a cookie so server-rendered pages pick it up on the
 * next request.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-white/20 bg-white/5 p-0.5",
        className,
      )}
      role="group"
      aria-label="Language / Sprache"
    >
      <Languages className="ml-2 mr-0.5 h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden />
      {LOCALES.map((l: Locale) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
              active
                ? "bg-gold text-navy-950"
                : "text-white/70 hover:text-white",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
