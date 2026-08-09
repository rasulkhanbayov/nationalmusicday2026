import Link from "next/link";
import { Music } from "lucide-react";
import { SITE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 text-white/70">
      <div className="container grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-white">
            <Music className="h-5 w-5 text-gold" />
            <span className="font-serif text-lg font-semibold">
              Common<span className="text-gold">tone</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            {SITE.tagline}. Concerts and recitals in the heart of Germany.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wider text-gold">
            Explore
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-gold">
                Home
              </Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-gold">
                All Events
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wider text-gold">
            Contact
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
            © {new Date().getFullYear()} {SITE.organizer}. All rights reserved.
          </p>
          <p>{SITE.domain}</p>
        </div>
      </div>
    </footer>
  );
}
