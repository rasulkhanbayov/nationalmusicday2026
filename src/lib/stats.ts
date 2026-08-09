import { prisma } from "./prisma";
import { OrderStatus, SeatStatus } from "@prisma/client";

export type DashboardStats = {
  totalSeats: number;
  ticketsSold: number;
  ticketsRemaining: number;
  revenueCents: number;
  checkedIn: number;
  paidOrders: number;
};

/**
 * Dashboard stats. Scoped to one event when `eventId` is given, otherwise
 * aggregated across all events.
 */
export async function getDashboardStats(
  eventId?: string,
): Promise<DashboardStats> {
  const seatWhere = eventId ? { eventId } : {};
  const orderWhere = eventId
    ? { eventId, status: OrderStatus.PAID }
    : { status: OrderStatus.PAID };
  const ticketWhere = eventId
    ? { eventId, checkedIn: true }
    : { checkedIn: true };

  const [total, sold, paidAgg, checkedIn, paidOrders] = await Promise.all([
    prisma.seat.count({ where: seatWhere }),
    prisma.seat.count({ where: { ...seatWhere, status: SeatStatus.SOLD } }),
    prisma.order.aggregate({ where: orderWhere, _sum: { totalCents: true } }),
    prisma.ticket.count({ where: ticketWhere }),
    prisma.order.count({ where: orderWhere }),
  ]);

  return {
    totalSeats: total,
    ticketsSold: sold,
    ticketsRemaining: total - sold,
    revenueCents: paidAgg._sum.totalCents ?? 0,
    checkedIn,
    paidOrders,
  };
}
