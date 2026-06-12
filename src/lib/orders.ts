import { prisma } from "./prisma";
import { OrderStatus, SeatStatus, Prisma } from "@prisma/client";
import { formatOrderNumber, buildTicketId } from "./utils";
import { ORDER_PREFIX } from "./constants";
import { sendConfirmationEmail } from "./email";
import type { TicketData } from "./ticket-pdf";

/**
 * Allocates the next sequential order number using a tiny counter row in
 * AppConfig, inside a transaction so concurrent checkouts don't collide.
 */
async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const COUNTER_KEY = "ORDER_SEQ";
  const existing = await tx.appConfig.findUnique({ where: { key: COUNTER_KEY } });
  const current = existing ? parseInt(existing.value, 10) || 0 : 0;
  const next = current + 1;
  await tx.appConfig.upsert({
    where: { key: COUNTER_KEY },
    update: { value: String(next) },
    create: { key: COUNTER_KEY, value: String(next) },
  });
  return formatOrderNumber(next);
}

export type CreateOrderInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  seatLabels: string[];
  unitPriceCents: number;
};

/** Creates a PENDING order with a fresh order number. */
export async function createPendingOrder(
  input: CreateOrderInput,
): Promise<{ id: string; orderNumber: string }> {
  const quantity = input.seatLabels.length;
  const totalCents = input.unitPriceCents * quantity;

  return prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx);
    const order = await tx.order.create({
      data: {
        orderNumber,
        status: OrderStatus.PENDING,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || null,
        unitPriceCents: input.unitPriceCents,
        quantity,
        totalCents,
      },
    });
    return { id: order.id, orderNumber: order.orderNumber };
  });
}

/**
 * Fulfills a paid order: marks the order PAID, converts its held seats to
 * SOLD, generates one Ticket per seat, and sends the confirmation email.
 *
 * Idempotent — safe to call multiple times for the same Stripe event
 * (webhooks can be delivered more than once). If the order is already PAID
 * and has tickets, it returns early without re-sending email.
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
        include: { seats: true, tickets: true },
      });
      if (!order) throw new Error(`Order ${orderId} not found`);

      // Already fulfilled — short-circuit (idempotency).
      if (order.status === OrderStatus.PAID && order.tickets.length > 0) {
        return { order, ticketData: [] as TicketData[], alreadyFulfilled: true };
      }

      const purchaserName = `${order.firstName} ${order.lastName}`.trim();
      const ticketData: TicketData[] = [];

      // Mark seats sold + create tickets.
      for (const seat of order.seats) {
        const ticketId = buildTicketId(order.orderNumber, seat.label);

        await tx.seat.update({
          where: { id: seat.id },
          data: {
            status: SeatStatus.SOLD,
            reservedUntil: null,
          },
        });

        await tx.ticket.upsert({
          where: { seatId: seat.id },
          update: {},
          create: {
            ticketId,
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

  // Send email outside the transaction so a slow email provider doesn't hold
  // database locks. Failure here is logged but does not roll back the sale.
  try {
    await sendConfirmationEmail({
      to: result.order.email,
      purchaserName: `${result.order.firstName} ${result.order.lastName}`.trim(),
      orderNumber: result.order.orderNumber,
      seatLabels: result.ticketData.map((t) => t.seatLabel),
      totalCents: result.order.totalCents,
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

export { ORDER_PREFIX };
