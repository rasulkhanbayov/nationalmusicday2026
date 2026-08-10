import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendConfirmationEmail } from "@/lib/email";
import { toEventView } from "@/lib/events";
import { parseItems } from "@/lib/orders";

export const dynamic = "force-dynamic";

// POST /api/admin/resend  { orderId }
// Re-sends the confirmation email (with PDF tickets) for a paid order.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let orderId: string;
  try {
    ({ orderId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

  try {
    await sendConfirmationEmail({
      to: order.email,
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

  return NextResponse.json({ ok: true });
}
