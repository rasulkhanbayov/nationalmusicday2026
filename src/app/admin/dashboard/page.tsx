import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, Armchair, Euro, UserCheck, Pencil } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventSelector } from "@/components/admin/event-selector";
import { ResendButton, ExportButton } from "@/components/admin/order-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { parseItems } from "@/lib/orders";
import { OrderStatus } from "@prisma/client";
import { getDashboardStats } from "@/lib/stats";
import { listAllEvents, rowLetters } from "@/lib/events";
import { formatEuros, priceLabel } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const events = await listAllEvents();

  if (events.length === 0) {
    return (
      <AdminShell>
        <EmptyState />
      </AdminShell>
    );
  }

  const { event: eventParam } = await searchParams;
  const active =
    events.find((e) => e.id === eventParam) ?? events[0];

  const [stats, orders] = await Promise.all([
    getDashboardStats(active.id),
    prisma.order.findMany({
      where: { eventId: active.id, status: OrderStatus.PAID },
      include: { tickets: true },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  const cards = [
    {
      label: "Tickets Sold",
      value: stats.ticketsSold,
      sub: stats.capacity === null ? "no limit" : `of ${stats.capacity}`,
      icon: Ticket,
    },
    {
      label: "Tickets Remaining",
      value: stats.ticketsRemaining ?? "—",
      sub:
        stats.capacity === null
          ? "unlimited"
          : `${Math.round((stats.ticketsRemaining! / stats.capacity) * 100)}% available`,
      icon: Armchair,
    },
    {
      label: "Revenue",
      value: active.isFree ? "Free" : formatEuros(stats.revenueCents),
      sub: `${stats.paidOrders} ${active.isFree ? "reservations" : "orders"}`,
      icon: Euro,
    },
    {
      label: "Checked-in Guests",
      value: stats.checkedIn,
      sub: `of ${stats.ticketsSold} ${active.isFree ? "reserved" : "sold"}`,
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
          <div className="mt-1 flex items-center gap-3">
            <p className="text-muted-foreground">{active.name}</p>
            <Badge variant={active.isFree ? "success" : "gold"}>
              {priceLabel(active.isFree, active.priceCents)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <EventSelector
            events={events.map((e) => ({
              id: e.id,
              name: e.name,
              isFree: e.isFree,
            }))}
            current={active.id}
          />
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/events/${active.id}`}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          </Button>
          <ExportButton eventId={active.id} />
        </div>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Orders table */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 font-serif text-xl font-semibold text-navy-900">
              {active.isFree ? "Reservations" : "Orders"}
            </h2>
            {orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No {active.isFree ? "reservations" : "paid orders"} yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Order</th>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 pr-3 font-medium">Tickets</th>
                      <th className="py-2 pr-3 font-medium">Total</th>
                      <th className="py-2 pr-3 font-medium">Check-in</th>
                      <th className="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const oitems = parseItems(o.itemsJson)
                        .filter((i) => i.quantity > 0)
                        .map((i) => `${i.quantity} × ${i.tier}`)
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
                            {oitems}
                          </td>
                          <td className="py-3 pr-3 font-medium">
                            {o.isFree ? "Free" : formatEuros(o.totalCents)}
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

      </div>
    </AdminShell>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="font-serif text-2xl font-bold text-navy-900">
        No events yet
      </h1>
      <p className="mt-2 text-muted-foreground">
        Create your first event to start selling tickets.
      </p>
      <Button asChild variant="gold" className="mt-6">
        <Link href="/admin/events/new">Create Event</Link>
      </Button>
    </div>
  );
}
