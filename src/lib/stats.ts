import { prisma } from "./prisma";
import { OrderStatus } from "@prisma/client";

export type DashboardStats = {
  /** Total tickets on sale (Event.capacity), or null when unlimited. */
  capacity: number | null;
  ticketsSold: number;
  /** Remaining tickets, or null when the event has no capacity limit. */
  ticketsRemaining: number | null;
  revenueCents: number;
  checkedIn: number;
  paidOrders: number;
};

/**
 * Dashboard stats. Scoped to one event when `eventId` is given, otherwise
 * aggregated across all events.
 *
 * Counts issued Tickets rather than seats: admission is general (no seat
 * selection), so the seat table is not written to and would always read zero.
 */
export async function getDashboardStats(
  eventId?: string,
): Promise<DashboardStats> {
  const ticketWhere = eventId ? { eventId } : {};
  const orderWhere = eventId
    ? { eventId, status: OrderStatus.PAID }
    : { status: OrderStatus.PAID };

  const [sold, checkedIn, paidAgg, paidOrders, capacityAgg] = await Promise.all([
    prisma.ticket.count({ where: ticketWhere }),
    prisma.ticket.count({ where: { ...ticketWhere, checkedIn: true } }),
    prisma.order.aggregate({ where: orderWhere, _sum: { totalCents: true } }),
    prisma.order.count({ where: orderWhere }),
    // One event → its own capacity. All events → the sum, treating an
    // unlimited event as unlimited overall.
    eventId
      ? prisma.event.findUnique({ where: { id: eventId }, select: { capacity: true } })
      : prisma.event.findMany({ select: { capacity: true } }),
  ]);

  let capacity: number | null;
  if (Array.isArray(capacityAgg)) {
    capacity = capacityAgg.some((e) => e.capacity === null)
      ? null
      : capacityAgg.reduce((n, e) => n + (e.capacity ?? 0), 0);
  } else {
    capacity = capacityAgg?.capacity ?? null;
  }

  return {
    capacity,
    ticketsSold: sold,
    ticketsRemaining: capacity === null ? null : Math.max(0, capacity - sold),
    revenueCents: paidAgg._sum.totalCents ?? 0,
    checkedIn,
    paidOrders,
  };
}
