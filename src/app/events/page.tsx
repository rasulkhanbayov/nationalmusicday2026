import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventsGrid } from "@/components/events-grid";
import { listPublicEventsWithAvailability } from "@/lib/events";
import {
  EventsPageHeader,
  PastEventsHeading,
} from "@/components/home-sections";

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
          <EventsPageHeader />
        </div>

        <div className="container py-14">
          <EventsGrid events={upcoming} />

          {past.length > 0 ? (
            <div className="mt-20">
              <PastEventsHeading />
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
