import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/schemas";
import { createPendingOrder, cancelOrder } from "@/lib/orders";
import { getEventById, ticketsRemaining } from "@/lib/events";
import { stripe } from "@/lib/stripe";
import { siteUrl, MAX_TICKETS_PER_ORDER } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkout — general-admission checkout.
 *
 * The buyer picks a quantity per ticket type (e.g. Standard / Support); there
 * is no seat selection. We create a PENDING order capturing the per-tier
 * breakdown, then hand off to Stripe Checkout. Tickets and their QR codes are
 * only issued once Stripe confirms payment (see /api/webhooks/stripe).
 */
export async function POST(req: NextRequest) {
  // Throttle: creating an order burns an order number and writes a row, so an
  // unthrottled endpoint lets a bot flood the table and inflate the counter.
  const limit = rateLimit(`checkout:${clientIp(req.headers)}`, 8, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
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
  if (event.status === EventStatus.SOLD_OUT) {
    return NextResponse.json(
      { error: "This event is sold out." },
      { status: 409 },
    );
  }

  // Resolve the requested quantities against the event's own tier list, so a
  // tampered client can't invent a ticket type or set its own price.
  const tiers = event.tiers.length
    ? event.tiers
    : [{ name: "Ticket", priceCents: event.priceCents }];

  const items = parsed.items
    .map((it) => {
      const tier = tiers.find((t) => t.name === it.tier);
      if (!tier) return null;
      return { tier: tier.name, priceCents: tier.priceCents, quantity: it.quantity };
    })
    .filter((x): x is { tier: string; priceCents: number; quantity: number } =>
      Boolean(x && x.quantity > 0),
    );

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Please select at least one ticket." },
      { status: 400 },
    );
  }

  const quantity = items.reduce((n, i) => n + i.quantity, 0);
  if (quantity > MAX_TICKETS_PER_ORDER) {
    return NextResponse.json(
      { error: `You can buy at most ${MAX_TICKETS_PER_ORDER} tickets per order.` },
      { status: 400 },
    );
  }

  // Capacity guard. Tickets already issued + this request must fit. Stripe
  // sessions expire, so we count issued tickets rather than pending orders —
  // an abandoned checkout never blocks a seat.
  const remaining = await ticketsRemaining(event.id, event.capacity);
  if (remaining !== null && quantity > remaining) {
    return NextResponse.json(
      {
        error:
          remaining === 0
            ? "This event is sold out."
            : `Only ${remaining} ticket${remaining === 1 ? "" : "s"} left.`,
        remaining,
      },
      { status: 409 },
    );
  }

  const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const base = siteUrl();

  const order = await createPendingOrder({
    eventId: event.id,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.email,
    phone: parsed.phone || null,
    items,
    quantity,
    totalCents,
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: parsed.email,
      locale: "auto",
      // Stripe emails the buyer a payment receipt. Live mode sends these
      // automatically; test mode needs receipts enabled in the Stripe
      // dashboard (Settings → Customer emails) to actually deliver.
      payment_intent_data: {
        receipt_email: parsed.email,
        description: `${event.name} — ${quantity} ticket${quantity === 1 ? "" : "s"}`,
      },
      line_items: items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: event.currency,
          unit_amount: i.priceCents,
          product_data: {
            name: `${event.name} — ${i.tier}`,
            description: `${event.dateLong} · ${event.venue.name}`,
          },
        },
      })),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        eventId: event.id,
      },
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/events/${event.slug}?cancelled=1`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      url: session.url,
      orderNumber: order.orderNumber,
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
