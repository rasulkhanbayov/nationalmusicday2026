import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/orders";
import { formatEuros } from "@/lib/config";
import { parseItems } from "@/lib/orders";

export const dynamic = "force-dynamic";

// GET /api/orders/confirm?session_id=...  (paid)  or  ?order=NM2026-000123 (free)
// Returns order details for the success page. For paid orders, acts as a
// fallback: if the webhook hasn't fulfilled yet but Stripe confirms payment,
// fulfill here.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  const orderNumber = req.nextUrl.searchParams.get("order");

  let order = sessionId
    ? await prisma.order.findUnique({
        where: { stripeSessionId: sessionId },
        include: { event: true },
      })
    : orderNumber
      ? await prisma.order.findUnique({
          where: { orderNumber },
          include: { event: true },
        })
      : null;

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Paid fallback: verify with Stripe and fulfill if needed.
  if (order.status !== "PAID" && sessionId) {
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
          include: { event: true },
        });
      }
    } catch (err) {
      console.error("[confirm] Stripe retrieve failed:", err);
    }
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    isFree: order.isFree,
    firstName: order.firstName,
    lastName: order.lastName,
    email: order.email,
    items: parseItems(order.itemsJson),
    quantity: order.quantity,
    total: order.isFree ? "Free" : formatEuros(order.totalCents),
    paid: order.status === "PAID",
    event: {
      name: order.event.name,
      nameEn: order.event.nameEn,
      slug: order.event.slug,
      notice: order.event.notice,
      noticeEn: order.event.noticeEn,
    },
  });
}
