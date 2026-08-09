import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventsGrid } from "@/components/events-grid";
import { listPublicEventsWithAvailability } from "@/lib/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Browse upcoming concerts and recitals celebrating Azerbaijani classical music in Germany. Reserve your seat online.",
};

export default async function EventsPage() {
  const events = await listPublicEventsWithAvailability();
  const upcoming = events.filter((e) => e.status !== "PAST");
  const past = events.filter((e) => e.status === "PAST");

  return (
    <>
      <SiteHeader />
      <main className="bg-navy-50/30">
        <div className="border-b border-border bg-white">
          <div className="container py-12 text-center">
            <span className="section-eyebrow">All Events</span>
            <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">
              Concerts & Recitals
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Choose an event to see the programme and reserve your seats.
            </p>
          </div>
        </div>

        <div className="container py-14">
          <EventsGrid events={upcoming} />

          {past.length > 0 ? (
            <div className="mt-20">
              <h2 className="mb-8 text-center font-serif text-2xl font-semibold text-navy-900">
                Past Events
              </h2>
              <div className="opacity-75">
                <EventsGrid events={past} />
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
