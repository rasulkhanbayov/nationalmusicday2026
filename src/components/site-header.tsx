"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { useLanguage } from "./language-provider";
import { LanguageSwitcher } from "./language-switcher";
import { BrandLogo } from "./brand-logo";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/events", label: t.nav.events },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/90 backdrop-blur supports-[backdrop-filter]:bg-navy-950/80">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white"
          aria-label={`${SITE.name} home`}
        >
          <BrandLogo className="h-6 w-auto text-white sm:h-7" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
          <LanguageSwitcher />
          <Button asChild variant="gold" size="sm">
            <Link href="/events">{t.nav.browseEvents}</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <LanguageSwitcher />
          <button
            className="text-white"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t.nav.close : t.nav.menu}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden",
          open ? "block border-t border-white/10" : "hidden",
        )}
      >
        <nav className="container flex flex-col gap-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild variant="gold" size="sm" className="mt-2">
            <Link href="/events" onClick={() => setOpen(false)}>
              {t.nav.browseEvents}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
