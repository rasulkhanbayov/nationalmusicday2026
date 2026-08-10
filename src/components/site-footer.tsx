"use client";

import Link from "next/link";
import { SITE } from "@/lib/constants";
import { useLanguage } from "./language-provider";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-white/10 bg-navy-950 text-white/70">
      <div className="container grid gap-10 py-14 md:grid-cols-3">
        <div>
          <BrandLogo className="h-6 w-auto text-white" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            {t.footer.tagline}.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wider text-gold">
            {t.footer.explore}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-gold">
                {t.nav.home}
              </Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-gold">
                {t.event.allEvents}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wider text-gold">
            {t.footer.contact}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`mailto:${SITE.contactEmail}`} className="hover:text-gold">
                {SITE.contactEmail}
              </a>
            </li>
            <li>{SITE.domain}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.organizer}. {t.footer.rights}
          </p>
          <p>{SITE.domain}</p>
        </div>
      </div>
    </footer>
  );
}
