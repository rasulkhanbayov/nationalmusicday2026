import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { createPendingOrder, fulfillOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/issue — manually issue tickets for one guest.
 *
 * For seats sold outside the public checkout: an extra chair added after the
 * event sold out, a guest who paid by transfer or a Stripe Payment Link, a
 * comp for an artist. Creates a normal PAID order and emails real QR tickets,
 * so the door scanner treats them exactly like any other ticket.
 *
 * Deliberately bypasses the capacity guard — the admin is the one adding the
 * chair. The event stays SOLD_OUT, so the public page keeps showing no
 * tickets for sale.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    eventId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    tier?: string;
    quantity?: number;
    priceCents?: number;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { eventId, firstName, lastName, email } = body;
  if (!eventId || !firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "eventId, firstName, lastName and email are required." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const quantity = Math.max(1, Math.min(10, Math.trunc(body.quantity ?? 1)));

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Default to the event's entry-level price unless an explicit amount is
  // given (0 = complimentary).
  const priceCents =
    typeof body.priceCents === "number" && body.priceCents >= 0
      ? Math.trunc(body.priceCents)
      : event.priceCents;
  const tier = body.tier?.trim() || "Standard Ticket";

  const order = await createPendingOrder({
    eventId: event.id,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    items: [{ tier, priceCents, quantity }],
    quantity,
    totalCents: priceCents * quantity,
  });

  await fulfillOrder({ orderId: order.id });

  const tickets = await prisma.ticket.findMany({
    where: { orderId: order.id },
    select: { ticketId: true },
    orderBy: { ticketId: "asc" },
  });

  console.info(
    `[issue] manual ticket(s) for ${email.trim()} — ${order.orderNumber} (${quantity}x ${tier})${body.note ? ` note: ${body.note}` : ""}`,
  );

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    tickets: tickets.map((t) => t.ticketId),
    sentTo: email.trim(),
  });
}
