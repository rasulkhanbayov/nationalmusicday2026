import type { Metadata } from "next";
import {
  Ticket,
  Armchair,
  Euro,
  UserCheck,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { SeatMap } from "@/components/seat-map";
import { PriceEditor } from "@/components/admin/price-editor";
import { ResendButton, ExportButton } from "@/components/admin/order-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { getDashboardStats } from "@/lib/stats";
import { getSeatMap } from "@/lib/seats";
import { getTicketPriceCents, formatEuros } from "@/lib/config";
import { HALL } from "@/lib/constants";
import { compareSeatLabels } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const [stats, seats, priceCents, orders] = await Promise.all([
    getDashboardStats(),
    getSeatMap(),
    getTicketPriceCents(),
    prisma.order.findMany({
      where: { status: OrderStatus.PAID },
      include: { seats: true, tickets: true },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  const cards = [
    {
      label: "Tickets Sold",
      value: stats.ticketsSold,
      sub: `of ${stats.totalSeats}`,
      icon: Ticket,
    },
    {
      label: "Tickets Remaining",
      value: stats.ticketsRemaining,
      sub: `${Math.round((stats.ticketsRemaining / stats.totalSeats) * 100)}% free`,
      icon: Armchair,
    },
    {
      label: "Revenue",
      value: formatEuros(stats.revenueCents),
      sub: `${stats.paidOrders} orders`,
      icon: Euro,
    },
    {
      label: "Checked-in Guests",
      value: stats.checkedIn,
      sub: `of ${stats.ticketsSold} sold`,
      icon: UserCheck,
    },
  ];

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-900">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            National Music Day 2026 · live overview
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {c.label}
                </p>
                <c.icon className="h-5 w-5 text-gold" />
              </div>
              <p className="mt-2 font-serif text-3xl font-bold text-navy-900">
                {c.value}
              </p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price config */}
      <Card className="mt-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Ticket Price
            </p>
            <p className="text-xs text-muted-foreground">
              Applies to new purchases. Past orders keep their original price.
            </p>
          </div>
          <PriceEditor initialEuros={priceCents / 100} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Orders table */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 font-serif text-xl font-semibold text-navy-900">
              Orders
            </h2>
            {orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No paid orders yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Order</th>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 pr-3 font-medium">Seats</th>
                      <th className="py-2 pr-3 font-medium">Total</th>
                      <th className="py-2 pr-3 font-medium">Check-in</th>
                      <th className="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const seats = o.seats
                        .map((s) => s.label)
                        .sort(compareSeatLabels)
                        .join(", ");
                      const checked = o.tickets.filter(
                        (t) => t.checkedIn,
                      ).length;
                      return (
                        <tr
                          key={o.id}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-3 pr-3 font-mono text-xs">
                            {o.orderNumber}
                          </td>
                          <td className="py-3 pr-3">
                            <div className="font-medium text-navy-900">
                              {o.firstName} {o.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {o.email}
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {seats}
                          </td>
                          <td className="py-3 pr-3 font-medium">
                            {formatEuros(o.totalCents)}
                          </td>
                          <td className="py-3 pr-3">
                            <Badge
                              variant={
                                checked === o.tickets.length
                                  ? "success"
                                  : checked > 0
                                    ? "warning"
                                    : "outline"
                              }
                            >
                              {checked}/{o.tickets.length}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            <ResendButton orderId={o.id} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seat overview */}
        <Card className="lg:sticky lg:top-8 lg:self-start">
          <CardContent className="pt-6">
            <h2 className="mb-4 font-serif text-xl font-semibold text-navy-900">
              Seat Overview
            </h2>
            <SeatMap seats={seats} rows={HALL.rows} seatsPerRow={HALL.seatsPerRow} readOnly />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
