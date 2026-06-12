import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/schemas";
import { reserveSeats, SeatUnavailableError } from "@/lib/seats";
import { createPendingOrder, cancelOrder } from "@/lib/orders";
import { getTicketPriceCents, formatEuros } from "@/lib/config";
import { stripe } from "@/lib/stripe";
import { EVENT, RESERVATION_MINUTES, siteUrl } from "@/lib/constants";
import { compareSeatLabels } from "@/lib/utils";

export const dynamic = "force-dynamic";

// POST /api/checkout — validates guest details + seats, holds the seats,
// creates a PENDING order, and returns a Stripe Checkout URL.
export async function POST(req: NextRequest) {
  let parsed;
  try {
    const body = await req.json();
    parsed = checkoutSchema.parse(body);
  } catch (err) {
    const message =
      err && typeof err === "object" && "errors" in err
        ? (err as { errors: { message: string }[] }).errors
            ?.map((e) => e.message)
            .join(", ")
        : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const seatLabels = [...parsed.seats].sort(compareSeatLabels);
  const unitPriceCents = await getTicketPriceCents();

  // 1. Create the pending order (gets an order number).
  const order = await createPendingOrder({
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.email,
    phone: parsed.phone || null,
    seatLabels,
    unitPriceCents,
  });

  // 2. Atomically hold the seats for this order.
  try {
    await reserveSeats(seatLabels, order.id);
  } catch (err) {
    // Roll back the order so we don't leak abandoned PENDING rows.
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

  // 3. Create the Stripe Checkout Session.
  const base = siteUrl();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: parsed.email,
      locale: "auto",
      // Expire the Stripe session in sync with our seat hold.
      expires_at: Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60,
      line_items: [
        {
          quantity: seatLabels.length,
          price_data: {
            currency: "eur",
            unit_amount: unitPriceCents,
            product_data: {
              name: `${EVENT.name} — Concert Ticket`,
              description: `Seats: ${seatLabels.join(", ")} · ${EVENT.dateLong}`,
            },
          },
        },
      ],
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        seats: seatLabels.join(","),
      },
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/seats?cancelled=1&order=${order.orderNumber}`,
    });

    // Persist the session id for webhook reconciliation.
    const { prisma } = await import("@/lib/prisma");
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      url: session.url,
      orderNumber: order.orderNumber,
      total: formatEuros(unitPriceCents * seatLabels.length),
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
