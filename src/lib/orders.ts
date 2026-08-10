import { prisma } from "./prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { formatOrderNumber } from "./utils";
import { sendConfirmationEmail } from "./email";
import { toEventView } from "./events";
import type { TicketData } from "./ticket-pdf";

/** One line of a general-admission order: N tickets of a given type. */
export type OrderItem = { tier: string; priceCents: number; quantity: number };

export function parseItems(raw: string | null): OrderItem[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OrderItem[];
  } catch {
    return [];
  }
}

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
  items: OrderItem[];
  quantity: number;
  totalCents: number;
};

/** Creates a PENDING order with a fresh order number. */
export async function createPendingOrder(
  input: CreateOrderInput,
): Promise<{ id: string; orderNumber: string }> {
  // Entry-level price, used for the legacy single-price column.
  const unitPriceCents = input.items.length
    ? Math.min(...input.items.map((i) => i.priceCents))
    : 0;

  return prisma.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx, input.eventId);
    const order = await tx.order.create({
      data: {
        eventId: input.eventId,
        orderNumber,
        status: OrderStatus.PENDING,
        isFree: input.totalCents === 0,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || null,
        unitPriceCents,
        quantity: input.quantity,
        totalCents: input.totalCents,
        itemsJson: JSON.stringify(input.items),
      },
    });
    return { id: order.id, orderNumber: order.orderNumber };
  });
}

/**
 * Fulfills a paid order: marks it PAID, issues one Ticket per purchased ticket
 * (each with its own unique id encoded in a QR code), and emails the tickets.
 *
 * Idempotent — Stripe may deliver a webhook more than once, and the success
 * page also triggers fulfillment as a fallback. If the order already has
 * tickets, this returns early without re-issuing or re-sending.
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
        include: { tickets: true, event: true },
      });
      if (!order) throw new Error(`Order ${orderId} not found`);

      if (order.status === OrderStatus.PAID && order.tickets.length > 0) {
        return { order, ticketData: [] as TicketData[], alreadyFulfilled: true };
      }

      const purchaserName = `${order.firstName} ${order.lastName}`.trim();
      const items = parseItems(order.itemsJson);
      const ticketData: TicketData[] = [];

      // One ticket row per purchased admission, numbered within the order so
      // ids stay stable and unique: NM2026-000123-01, -02, …
      let n = 0;
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          n += 1;
          const ticketId = `${order.orderNumber}-${String(n).padStart(2, "0")}`;
          await tx.ticket.upsert({
            where: { ticketId },
            update: {},
            create: {
              ticketId,
              eventId: order.eventId,
              orderId: order.id,
              tierName: item.tier,
              priceCents: item.priceCents,
            },
          });
          ticketData.push({
            ticketId,
            orderNumber: order.orderNumber,
            tierName: item.tier,
            purchaserName,
          });
        }
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

  if (result.alreadyFulfilled) return { alreadyFulfilled: true };

  // Close sales automatically once the last ticket is issued, so the event
  // page and checkout both report sold out without manual admin action.
  const cap = result.order.event.capacity;
  if (cap !== null) {
    const issued = await prisma.ticket.count({
      where: { eventId: result.order.eventId },
    });
    if (issued >= cap && result.order.event.status !== "SOLD_OUT") {
      await prisma.event
        .update({
          where: { id: result.order.eventId },
          data: { status: "SOLD_OUT" },
        })
        .catch(() => {});
    }
  }

  // Send outside the transaction so a slow provider doesn't hold DB locks.
  // A send failure is logged but never rolls back a completed sale — the
  // admin can resend from the dashboard.
  try {
    await sendConfirmationEmail({
      to: result.order.email,
      purchaserName: `${result.order.firstName} ${result.order.lastName}`.trim(),
      orderNumber: result.order.orderNumber,
      totalCents: result.order.totalCents,
      isFree: result.order.isFree,
      items: parseItems(result.order.itemsJson),
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

/** Marks an order cancelled (payment abandoned or expired). */
export async function cancelOrder(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === OrderStatus.PAID) return;
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  });
}
