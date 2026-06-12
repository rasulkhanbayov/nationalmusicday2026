import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { fulfillOrder, cancelOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
// Stripe needs the raw body for signature verification.
export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// POST /api/webhooks/stripe
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        // Only fulfill when actually paid.
        if (orderId && session.payment_status === "paid") {
          await fulfillOrder({
            orderId,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          // Release the held seats — buyer never completed payment.
          await cancelOrder(orderId);
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) await cancelOrder(orderId);
        break;
      }

      default:
        // Ignore unrelated events.
        break;
    }
  } catch (err) {
    console.error(`[webhook] Handler error for ${event.type}:`, err);
    // Return 500 so Stripe retries delivery.
    return NextResponse.json(
      { error: "Handler failed" },
      { status: 500 },
    );
  }

  // Touch prisma to keep the connection warm in serverless (no-op query guard).
  void prisma;

  return NextResponse.json({ received: true });
}
