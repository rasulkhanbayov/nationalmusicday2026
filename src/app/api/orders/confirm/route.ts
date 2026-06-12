import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/orders";
import { formatEuros } from "@/lib/config";
import { compareSeatLabels } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/orders/confirm?session_id=...
// Used by the success page to display order details. Acts as a safety net:
// if the webhook hasn't fulfilled yet but Stripe confirms payment, fulfill here.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  let order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: { seats: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // If not yet marked paid, verify with Stripe and fulfill as a fallback.
  if (order.status !== "PAID") {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await fulfillOrder({
          orderId: order.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
        });
        order = await prisma.order.findUnique({
          where: { id: order.id },
          include: { seats: true },
        });
      }
    } catch (err) {
      console.error("[confirm] Stripe retrieve failed:", err);
    }
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const seats = order.seats
    .map((s) => s.label)
    .sort(compareSeatLabels);

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    firstName: order.firstName,
    lastName: order.lastName,
    email: order.email,
    seats,
    quantity: order.quantity,
    total: formatEuros(order.totalCents),
    paid: order.status === "PAID",
  });
}
