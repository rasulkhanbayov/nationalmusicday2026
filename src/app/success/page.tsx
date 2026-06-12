import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, Ticket, CalendarDays, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/orders";
import { formatEuros } from "@/lib/config";
import { compareSeatLabels } from "@/lib/utils";
import { EVENT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

async function loadOrder(sessionId: string) {
  let order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: { seats: true },
  });
  if (!order) return null;

  // Fallback fulfillment in case the webhook is delayed.
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
    } catch {
      // Ignore — show pending state below.
    }
  }
  return order;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const order = session_id ? await loadOrder(session_id) : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-navy-50/30">
        <div className="container flex min-h-[70vh] items-center justify-center py-16">
          {!order ? (
            <NotFound />
          ) : (
            <Card className="w-full max-w-xl">
              <CardContent className="pt-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-9 w-9 text-green-600" />
                </div>
                <h1 className="mt-6 font-serif text-3xl font-bold text-navy-900">
                  {order.status === "PAID"
                    ? "Order Confirmed"
                    : "Payment Processing"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {order.status === "PAID"
                    ? "Thank you! Your tickets are on their way."
                    : "Your payment is being confirmed. Your tickets will arrive by email shortly."}
                </p>

                <div className="mt-6">
                  <Badge variant="gold" className="text-sm">
                    {order.orderNumber}
                  </Badge>
                </div>

                <div className="mt-8 space-y-4 rounded-lg bg-secondary p-6 text-left">
                  <Detail
                    icon={Ticket}
                    label="Seats"
                    value={order.seats
                      .map((s) => s.label)
                      .sort(compareSeatLabels)
                      .join(", ")}
                  />
                  <Detail
                    icon={CalendarDays}
                    label="Date"
                    value={`${EVENT.dateLong} · Doors ${EVENT.doorsTime}`}
                  />
                  <Detail
                    icon={MapPin}
                    label="Venue"
                    value={`${EVENT.venue.name}, ${EVENT.venue.city}`}
                  />
                  <Detail
                    icon={Mail}
                    label="Confirmation sent to"
                    value={order.email}
                  />
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-muted-foreground">
                    {order.quantity}{" "}
                    {order.quantity === 1 ? "ticket" : "tickets"}
                  </span>
                  <span className="font-serif text-2xl font-bold text-navy-900">
                    {formatEuros(order.totalCents)}
                  </span>
                </div>

                <p className="mt-6 text-sm text-muted-foreground">
                  Your PDF tickets (with QR codes) have been emailed to you.
                  Please bring them to the entrance.
                </p>

                <Button asChild variant="outline" className="mt-6">
                  <Link href="/">Back to Home</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-medium text-navy-900">{value}</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-10 text-center">
        <h1 className="font-serif text-2xl font-bold text-navy-900">
          Order Not Found
        </h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find this order. If you completed a payment, check
          your email for confirmation.
        </p>
        <Button asChild variant="gold" className="mt-6">
          <Link href="/seats">Choose Seats</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
