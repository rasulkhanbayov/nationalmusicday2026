import Link from "next/link";
import { Music } from "lucide-react";
import { EVENT } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 text-white/70">
      <div className="container grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-white">
            <Music className="h-5 w-5 text-gold" />
            <span className="font-serif text-lg font-semibold">
              National Music Day <span className="text-gold">2026</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            {EVENT.subtitle}. An evening of Azerbaijani classical music in the
            heart of Munich.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wider text-gold">
            Event
          </h4>
          <ul className="space-y-2 text-sm">
            <li>{EVENT.dateLong}</li>
            <li>
              Doors {EVENT.doorsTime} · Start {EVENT.startTime}
            </li>
            <li>{EVENT.venue.name}</li>
            <li>
              {EVENT.venue.street}, {EVENT.venue.postalCode}{" "}
              {EVENT.venue.city}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wider text-gold">
            Links
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/seats" className="hover:text-gold">
                Buy Tickets
              </Link>
            </li>
            <li>
              <Link href="/#program" className="hover:text-gold">
                Program
              </Link>
            </li>
            <li>
              <Link href="/#venue" className="hover:text-gold">
                Venue & Directions
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${EVENT.contactEmail}`}
                className="hover:text-gold"
              >
                {EVENT.contactEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} National Music Day. All rights
            reserved.
          </p>
          <p>{EVENT.domain}</p>
        </div>
      </div>
    </footer>
  );
}
