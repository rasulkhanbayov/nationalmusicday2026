import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendConfirmationEmail } from "@/lib/email";
import { toEventView } from "@/lib/events";
import { parseItems } from "@/lib/orders";

export const dynamic = "force-dynamic";

// POST /api/admin/resend  { orderId, email? }
// Re-sends the confirmation email (with PDF tickets) for a paid order.
//
// `email` optionally corrects a mistyped address: it is saved on the order and
// used for this and all future sends. Ticket ids are never regenerated, so any
// QR already in circulation stays valid.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let orderId: string;
  let email: string | undefined;
  try {
    ({ orderId, email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const corrected = typeof email === "string" ? email.trim() : "";
  if (corrected && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(corrected)) {
    return NextResponse.json(
      { error: "That does not look like a valid email address." },
      { status: 400 },
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { tickets: { orderBy: { ticketId: "asc" } }, event: true },
  });

  if (!order || order.status !== OrderStatus.PAID) {
    return NextResponse.json(
      { error: "Confirmed order not found" },
      { status: 404 },
    );
  }

  const purchaserName = `${order.firstName} ${order.lastName}`.trim();

  // Persist the correction first, so a later resend (or any support lookup)
  // uses the fixed address even if this send fails.
  const to = corrected || order.email;
  if (corrected && corrected !== order.email) {
    await prisma.order.update({
      where: { id: order.id },
      data: { email: corrected },
    });
    console.info(
      `[resend] ${order.orderNumber}: email corrected ${order.email} -> ${corrected}`,
    );
  }

  try {
    await sendConfirmationEmail({
      to,
      purchaserName,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      isFree: order.isFree,
      items: parseItems(order.itemsJson),
      event: toEventView(order.event),
      // Re-send the tickets that were actually issued, so ids match the
      // originals (and any QR already in the buyer's inbox stays valid).
      tickets: order.tickets.map((t) => ({
        ticketId: t.ticketId,
        orderNumber: order.orderNumber,
        tierName: t.tierName ?? "Ticket",
        purchaserName,
      })),
    });
  } catch (err) {
    console.error("[resend] failed:", err);
    return NextResponse.json(
      { error: "Email could not be sent" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, sentTo: to });
}
