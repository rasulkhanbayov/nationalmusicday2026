import Link from "next/link";
import { ArrowRight, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventsGrid } from "@/components/events-grid";
import { listPublicEventsWithAvailability } from "@/lib/events";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await listPublicEventsWithAvailability();
  const upcoming = events.filter((e) => e.status !== "PAST");
  const featured = upcoming[0];

  return (
    <>
      <SiteHeader />
      <main>
        {/* Landing hero */}
        <section className="relative isolate overflow-hidden bg-navy-950 text-white">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950" />
            <div className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
          </div>
          <div className="container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
            <span className="section-eyebrow animate-fade-up">
              <Music className="mr-1 inline h-3.5 w-3.5" /> {SITE.tagline}
            </span>
            <h1 className="mt-2 max-w-4xl animate-fade-up font-serif text-5xl font-bold leading-[1.05] sm:text-7xl">
              {SITE.name} <span className="text-gold">Events</span>
            </h1>
            <p
              className="mt-6 max-w-2xl animate-fade-up text-lg text-white/75 sm:text-xl"
              style={{ animationDelay: "0.1s" }}
            >
              Concerts and recitals in the heart of Germany, presented by
              Commontone. Browse upcoming events and reserve your seat.
            </p>
            <div
              className="mt-10 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Button asChild variant="gold" size="lg">
                <Link href="/events">
                  Browse Events <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured / upcoming events */}
        <section className="bg-navy-50/30 py-20">
          <div className="container">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="section-eyebrow">What&apos;s On</span>
              <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
                Upcoming Events
              </h2>
              <div className="gold-rule mt-5" />
            </div>
            <EventsGrid events={upcoming} />
            {featured ? (
              <div className="mt-12 text-center">
                <Button asChild variant="outline">
                  <Link href={`/events/${featured.slug}`}>
                    View {featured.name} <ArrowRight />
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
