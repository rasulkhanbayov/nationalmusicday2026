import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingClient } from "@/components/booking-client";
import { CancelNotice } from "@/components/cancel-notice";
import { getSeatMap } from "@/lib/seats";
import { getTicketPriceCents } from "@/lib/config";
import { HALL, EVENT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose Your Seats",
  description: `Select your seats for ${EVENT.name} at ${EVENT.venue.name}, Munich. Only ${EVENT.capacity} seats available.`,
};

export default async function SeatsPage() {
  const [seats, priceCents] = await Promise.all([
    getSeatMap(),
    getTicketPriceCents(),
  ]);

  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <CancelNotice />
      </Suspense>
      <main className="bg-navy-50/30">
        <div className="border-b border-border bg-white">
          <div className="container py-10 text-center">
            <span className="section-eyebrow">{EVENT.dateLong}</span>
            <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">
              Choose Your Seats
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {EVENT.venue.name}, {EVENT.venue.city} · Pick your seats below,
              then check out as a guest — no account needed.
            </p>
          </div>
        </div>

        <div className="container py-12">
          <BookingClient
            initial={{
              seats,
              priceCents,
              rows: HALL.rows,
              seatsPerRow: HALL.seatsPerRow,
            }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
