import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventsGrid } from "@/components/events-grid";
import { listPublicEventsWithAvailability } from "@/lib/events";
import { HomeHero, UpcomingHeading } from "@/components/home-sections";

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
            <HomeHero />
          </div>
        </section>

        {/* Featured / upcoming events */}
        <section className="bg-navy-50/30 py-20">
          <div className="container">
            <UpcomingHeading />
            <EventsGrid events={upcoming} />
            {featured ? (
              <div className="mt-12 text-center">
                <Button asChild variant="outline">
                  <Link href={`/events/${featured.slug}`}>
                    {featured.name} <ArrowRight />
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
