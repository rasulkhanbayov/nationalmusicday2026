import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/schemas";
import { reserveSeats, SeatUnavailableError } from "@/lib/seats";
import {
  createPendingOrder,
  cancelOrder,
  createFreeReservation,
} from "@/lib/orders";
import { getEventById } from "@/lib/events";
import { formatEuros } from "@/lib/config";
import { stripe } from "@/lib/stripe";
import { RESERVATION_MINUTES, siteUrl } from "@/lib/constants";
import { compareSeatLabels } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// Tickets are currently sold on an external site (see Event.ticketUrl), so the
// built-in checkout is switched off. The implementation below is kept intact —
// flip this to true (along with the matching flag in
// src/app/events/[slug]/seats/page.tsx) to sell on this site again.
const BUILT_IN_CHECKOUT_ENABLED = false;

// POST /api/checkout — validates guest details + seats for an event.
// Free events: reserve + confirm immediately (no Stripe), return success URL.
// Paid events: reserve, create PENDING order, return a Stripe Checkout URL.
export async function POST(req: NextRequest) {
  if (!BUILT_IN_CHECKOUT_ENABLED) {
    return NextResponse.json(
      { error: "Tickets for this event are sold on our ticketing partner's site." },
      { status: 410 },
    );
  }

  let parsed;
  try {
    parsed = checkoutSchema.parse(await req.json());
  } catch (err) {
    const message =
      err && typeof err === "object" && "errors" in err
        ? (err as { errors: { message: string }[] }).errors
            ?.map((e) => e.message)
            .join(", ")
        : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const event = await getEventById(parsed.eventId);
  if (!event || event.status === EventStatus.DRAFT) {
    return NextResponse.json({ error: "Event not available" }, { status: 404 });
  }
  if (event.status === EventStatus.PAST) {
    return NextResponse.json(
      { error: "This event has already taken place." },
      { status: 409 },
    );
  }

  const seatLabels = [...parsed.seats].sort(compareSeatLabels);
  const base = siteUrl();

  // ── Free event: reserve + confirm directly, no payment. ──
  if (event.isFree) {
    try {
      const { orderNumber } = await createFreeReservation({
        eventId: event.id,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        phone: parsed.phone || null,
        seatLabels,
      });
      return NextResponse.json({
        free: true,
        orderNumber,
        url: `${base}/success?order=${encodeURIComponent(orderNumber)}`,
        total: "Free",
      });
    } catch (err) {
      if (err instanceof SeatUnavailableError) {
        return NextResponse.json(
          {
            error: `Sorry, these seats are no longer available: ${err.unavailable.join(", ")}. Please pick different seats.`,
            unavailable: err.unavailable,
          },
          { status: 409 },
        );
      }
      console.error("[checkout] free reservation error:", err);
      return NextResponse.json(
        { error: "Could not complete your reservation. Please try again." },
        { status: 500 },
      );
    }
  }

  // ── Paid event: reserve, then create a Stripe Checkout session. ──
  const order = await createPendingOrder({
    eventId: event.id,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.email,
    phone: parsed.phone || null,
    seatLabels,
    unitPriceCents: event.priceCents,
    isFree: false,
  });

  try {
    await reserveSeats(event.id, seatLabels, order.id);
  } catch (err) {
    await cancelOrder(order.id).catch(() => {});
    if (err instanceof SeatUnavailableError) {
      return NextResponse.json(
        {
          error: `Sorry, these seats are no longer available: ${err.unavailable.join(", ")}. Please pick different seats.`,
          unavailable: err.unavailable,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Could not reserve seats. Please try again." },
      { status: 500 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: parsed.email,
      locale: "auto",
      expires_at: Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60,
      line_items: [
        {
          quantity: seatLabels.length,
          price_data: {
            currency: event.currency,
            unit_amount: event.priceCents,
            product_data: {
              name: `${event.name} — Ticket`,
              description: `Seats: ${seatLabels.join(", ")} · ${event.dateLong}`,
            },
          },
        },
      ],
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        eventId: event.id,
        seats: seatLabels.join(","),
      },
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/events/${event.slug}/seats?cancelled=1`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      url: session.url,
      orderNumber: order.orderNumber,
      total: formatEuros(event.priceCents * seatLabels.length),
    });
  } catch (err) {
    console.error("[checkout] Stripe session error:", err);
    await cancelOrder(order.id).catch(() => {});
    return NextResponse.json(
      { error: "Payment could not be started. Please try again." },
      { status: 500 },
    );
  }
}
