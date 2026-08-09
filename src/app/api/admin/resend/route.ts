import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendConfirmationEmail } from "@/lib/email";
import { toEventView } from "@/lib/events";
import { buildTicketId, compareSeatLabels } from "@/lib/utils";

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
    include: { seats: true, event: true },
  });

  if (!order || order.status !== OrderStatus.PAID) {
    return NextResponse.json(
      { error: "Confirmed order not found" },
      { status: 404 },
    );
  }

  const purchaserName = `${order.firstName} ${order.lastName}`.trim();
  const seats = order.seats
    .slice()
    .sort((a, b) => compareSeatLabels(a.label, b.label));

  try {
    await sendConfirmationEmail({
      to: order.email,
      purchaserName,
      orderNumber: order.orderNumber,
      seatLabels: seats.map((s) => s.label),
      totalCents: order.totalCents,
      isFree: order.isFree,
      event: toEventView(order.event),
      tickets: seats.map((s) => ({
        ticketId: buildTicketId(order.orderNumber, s.label),
        orderNumber: order.orderNumber,
        seatLabel: s.label,
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
