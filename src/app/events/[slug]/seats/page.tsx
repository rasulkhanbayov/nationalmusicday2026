import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingClient } from "@/components/booking-client";
import { CancelNotice } from "@/components/cancel-notice";
import { getEventBySlug, rowLetters } from "@/lib/events";
import { getSeatMap } from "@/lib/seats";

export const dynamic = "force-dynamic";

// Tickets are currently sold on an external site, so the built-in booking flow
// is switched off. The code below is kept intact so it can be re-enabled by
// flipping this flag back to true (see also /api/checkout, which refuses while
// this is off, and Event.ticketUrl, which drives the outbound CTAs).
const BUILT_IN_BOOKING_ENABLED = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return {
    title: event ? `Choose Your Seats — ${event.name}` : "Choose Your Seats",
    robots: { index: false, follow: true },
  };
}

export default async function EventSeatsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!BUILT_IN_BOOKING_ENABLED) notFound();

  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status === "DRAFT" || event.status === "PAST") notFound();

  const seats = await getSeatMap(event.id);

  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <CancelNotice />
      </Suspense>
      <main className="bg-navy-50/30">
        <div className="border-b border-border bg-white">
          <div className="container py-10 text-center">
            <span className="section-eyebrow">
              {event.dateLong} · {event.venue.city}
            </span>
            <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">
              {event.name}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {event.isFree
                ? "Pick your seats below, then reserve as a guest — admission is free, no account needed."
                : "Pick your seats below, then check out as a guest — no account needed."}
            </p>
          </div>
        </div>

        <div className="container py-12">
          <BookingClient
            initial={{
              eventId: event.id,
              slug: event.slug,
              isFree: event.isFree,
              priceCents: event.priceCents,
              seats,
              rows: rowLetters(event.rows),
              seatsPerRow: event.seatsPerRow,
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
