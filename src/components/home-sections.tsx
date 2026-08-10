"use client";

import Link from "next/link";
import { ArrowRight, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./language-provider";

/** Landing hero copy — client-side so it follows the language switcher. */
export function HomeHero() {
  const { t } = useLanguage();
  return (
    <>
      <span className="section-eyebrow animate-fade-up">
        <Music className="mr-1 inline h-3.5 w-3.5" /> {t.footer.tagline}
      </span>
      {/* Wordmark styled like the brand logo: lowercase, "tone" in gold. */}
      <h1 className="mt-2 max-w-4xl animate-fade-up font-serif text-5xl font-bold leading-[1.05] sm:text-7xl">
        common<span className="text-gold">tone</span>{" "}
        <span className="text-white">Events</span>
      </h1>
      <p
        className="mt-6 max-w-2xl animate-fade-up text-lg text-white/75 sm:text-xl"
        style={{ animationDelay: "0.1s" }}
      >
        {t.home.heroLead}
      </p>
      <div className="mt-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <Button asChild variant="gold" size="lg">
          <Link href="/events">
            {t.nav.browseEvents} <ArrowRight />
          </Link>
        </Button>
      </div>
    </>
  );
}

/** "What's On / Upcoming Events" heading above the card grid. */
export function UpcomingHeading() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <span className="section-eyebrow">{t.events.title}</span>
      <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
        {t.home.upcoming}
      </h2>
      <div className="gold-rule mt-5" />
    </div>
  );
}

/** Page header for /events. */
export function EventsPageHeader() {
  const { t } = useLanguage();
  return (
    <div className="container py-12 text-center">
      <span className="section-eyebrow">{t.event.allEvents}</span>
      <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">
        {t.events.title}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        {t.events.subtitle}
      </p>
    </div>
  );
}

/** "Past Events" sub-heading on /events. */
export function PastEventsHeading() {
  const { t } = useLanguage();
  return (
    <h2 className="mb-8 text-center font-serif text-2xl font-semibold text-navy-900">
      {t.events.ended}
    </h2>
  );
}
