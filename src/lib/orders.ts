import { prisma } from "./prisma";
import { OrderStatus, SeatStatus, Prisma } from "@prisma/client";
import { formatOrderNumber, buildTicketId } from "./utils";
import { reserveSeats, SeatUnavailableError } from "./seats";
import { sendConfirmationEmail } from "./email";
import { toEventView } from "./events";
import type { TicketData } from "./ticket-pdf";

/**
 * Allocates the next sequential order number for an event using the event's
 * own counter (Event.orderSeq), inside a transaction so concurrent checkouts
 * don't collide. Returns e.g. "NM2026-000123".
 */
async function nextOrderNumber(
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<string> {
  const event = await tx.event.update({
    where: { id: eventId },
    data: { orderSeq: { increment: 1 } },
    select: { orderPrefix: true, orderSeq: true },
  });
  return formatOrderNumber(event.orderPrefix, event.orderSeq);
}

export type CreateOrderInput = {
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  seatLabels: string[];
  unitPriceCents: number;
  isFree: boolean;
};

/** Creates a PENDING order for an event with a fresh order number. */
export async function createPendingOrder(
  input: CreateOrderInput,
): Promise<{ id: string; orderNumber: string }> {
  const quantity = input.seatLabels.length;
  const unit = input.isFree ? 0 : input.unitPriceCents;
  const totalCents = unit * quantity;

  return prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx, input.eventId);
    const order = await tx.order.create({
      data: {
        eventId: input.eventId,
        orderNumber,
        status: OrderStatus.PENDING,
        isFree: input.isFree,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || null,
        unitPriceCents: unit,
        quantity,
        totalCents,
      },
    });
    return { id: order.id, orderNumber: order.orderNumber };
  });
}

/**
 * Fulfills an order: marks it PAID, converts its held seats to SOLD, generates
 * one Ticket per seat, and sends the confirmation email. Works for both paid
 * (post-Stripe) and free (post-RSVP) orders — the email copy adapts via the
 * order's isFree flag.
 *
 * Idempotent — safe to call multiple times (Stripe may deliver a webhook more
 * than once). If already PAID with tickets, returns early without re-sending.
 */
export async function fulfillOrder(params: {
  orderId: string;
  stripePaymentIntentId?: string | null;
}): Promise<{ alreadyFulfilled: boolean }> {
  const { orderId, stripePaymentIntentId } = params;

  const result = await prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { seats: true, tickets: true, event: true },
      });
      if (!order) throw new Error(`Order ${orderId} not found`);

      // Already fulfilled — short-circuit (idempotency).
      if (order.status === OrderStatus.PAID && order.tickets.length > 0) {
        return { order, ticketData: [] as TicketData[], alreadyFulfilled: true };
      }

      const purchaserName = `${order.firstName} ${order.lastName}`.trim();
      const ticketData: TicketData[] = [];

      for (const seat of order.seats) {
        const ticketId = buildTicketId(order.orderNumber, seat.label);

        await tx.seat.update({
          where: { id: seat.id },
          data: { status: SeatStatus.SOLD, reservedUntil: null },
        });

        await tx.ticket.upsert({
          where: { seatId: seat.id },
          update: {},
          create: {
            ticketId,
            eventId: order.eventId,
            orderId: order.id,
            seatId: seat.id,
          },
        });

        ticketData.push({
          ticketId,
          orderNumber: order.orderNumber,
          seatLabel: seat.label,
          purchaserName,
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          stripePaymentIntentId: stripePaymentIntentId ?? undefined,
        },
      });

      return { order, ticketData, alreadyFulfilled: false };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (result.alreadyFulfilled) {
    return { alreadyFulfilled: true };
  }

  // Send email outside the transaction so a slow provider doesn't hold DB
  // locks. Failure here is logged but does not roll back the sale/reservation.
  try {
    await sendConfirmationEmail({
      to: result.order.email,
      purchaserName: `${result.order.firstName} ${result.order.lastName}`.trim(),
      orderNumber: result.order.orderNumber,
      seatLabels: result.ticketData.map((t) => t.seatLabel),
      totalCents: result.order.totalCents,
      isFree: result.order.isFree,
      event: toEventView(result.order.event),
      tickets: result.ticketData,
    });
  } catch (err) {
    console.error(
      `[orders] Confirmation email failed for ${result.order.orderNumber}:`,
      err,
    );
  }

  return { alreadyFulfilled: false };
}

/**
 * End-to-end free reservation: creates the order, holds the seats, and
 * immediately fulfills (no Stripe). Returns the order number so the client can
 * route to the success page.
 */
export async function createFreeReservation(input: {
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  seatLabels: string[];
}): Promise<{ orderNumber: string }> {
  const order = await createPendingOrder({
    ...input,
    unitPriceCents: 0,
    isFree: true,
  });

  try {
    await reserveSeats(input.eventId, input.seatLabels, order.id);
  } catch (err) {
    await cancelOrder(order.id).catch(() => {});
    throw err;
  }

  await fulfillOrder({ orderId: order.id });
  return { orderNumber: order.orderNumber };
}

/** Marks an order cancelled and releases its held seats. */
export async function cancelOrder(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === OrderStatus.PAID) return;

    await tx.seat.updateMany({
      where: { orderId, status: SeatStatus.RESERVED },
      data: { status: SeatStatus.AVAILABLE, reservedUntil: null, orderId: null },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  });
}

export { SeatUnavailableError };
