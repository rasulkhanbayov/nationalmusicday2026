import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAllEvents } from "@/lib/events";
import { getDashboardStats } from "@/lib/stats";
import { priceLabel } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Events",
  robots: { index: false, follow: false },
};

const statusVariant: Record<
  string,
  "default" | "gold" | "success" | "warning" | "destructive" | "outline"
> = {
  PUBLISHED: "success",
  DRAFT: "outline",
  SOLD_OUT: "warning",
  PAST: "outline",
};

export default async function AdminEventsPage() {
  const events = await listAllEvents();
  const withStats = await Promise.all(
    events.map(async (e) => ({ event: e, stats: await getDashboardStats(e.id) })),
  );

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-900">Events</h1>
          <p className="text-muted-foreground">
            Create and manage events. Each has its own seats, pricing and tickets.
          </p>
        </div>
        <Button asChild variant="gold">
          <Link href="/admin/events/new">
            <Plus /> New Event
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {withStats.map(({ event, stats }) => (
          <Card key={event.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-semibold text-navy-900">
                    {event.name}
                  </h2>
                  <Badge variant={statusVariant[event.status] ?? "outline"}>
                    {event.status}
                  </Badge>
                  <Badge variant={event.isFree ? "success" : "gold"}>
                    {priceLabel(event.isFree, event.priceCents)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.dateLong} · {event.venue.city} ·{" "}
                  {stats.ticketsSold}/{stats.totalSeats} seats sold
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/events/${event.slug}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/events/${event.id}`}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
