import { prisma } from "./prisma";
import { OrderStatus, SeatStatus } from "@prisma/client";
import { HALL } from "./constants";

export type DashboardStats = {
  totalSeats: number;
  ticketsSold: number;
  ticketsRemaining: number;
  revenueCents: number;
  checkedIn: number;
  paidOrders: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [sold, paidAgg, checkedIn, paidOrders] = await Promise.all([
    prisma.seat.count({ where: { status: SeatStatus.SOLD } }),
    prisma.order.aggregate({
      where: { status: OrderStatus.PAID },
      _sum: { totalCents: true },
    }),
    prisma.ticket.count({ where: { checkedIn: true } }),
    prisma.order.count({ where: { status: OrderStatus.PAID } }),
  ]);

  return {
    totalSeats: HALL.totalSeats,
    ticketsSold: sold,
    ticketsRemaining: HALL.totalSeats - sold,
    revenueCents: paidAgg._sum.totalCents ?? 0,
    checkedIn,
    paidOrders,
  };
}
