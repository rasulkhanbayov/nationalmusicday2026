import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Music2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { priceLabel } from "@/lib/config";
import type { EventView } from "@/lib/events";

export type EventCardData = EventView & { available: number };

export function EventCard({ event }: { event: EventCardData }) {
  const soldOut = event.available <= 0 || event.status === "SOLD_OUT";
  const isPast = event.status === "PAST";
  const href = `/events/${event.slug}`;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={href} className="block">
        <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <Music2 className="h-12 w-12 text-gold/70" />
          )}
          <div className="absolute right-3 top-3 z-10">
            {isPast ? (
              <Badge variant="outline" className="bg-white/90">
                Past
              </Badge>
            ) : soldOut ? (
              <Badge variant="destructive">Sold Out</Badge>
            ) : event.isFree ? (
              <Badge variant="success">Free</Badge>
            ) : (
              <Badge variant="gold">
                {event.tiers.length > 1
                  ? `from ${priceLabel(false, Math.min(...event.tiers.map((t) => t.priceCents)))}`
                  : priceLabel(false, event.priceCents)}
              </Badge>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col pt-5">
        <Link href={href}>
          <h3 className="font-serif text-xl font-semibold text-navy-900 group-hover:text-gold">
            {event.name}
          </h3>
        </Link>
        {event.subtitle ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {event.subtitle}
          </p>
        ) : null}

        <div className="mt-4 space-y-1.5 text-sm text-navy-800">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" /> {event.dateLong}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gold" /> {event.venue.name},{" "}
            {event.venue.city}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">
            {isPast
              ? "Ended"
              : soldOut
                ? "Sold out"
                : event.ticketUrl
                  ? "Tickets available"
                  : "Coming soon"}
          </span>
          <Link
            href={href}
            className="flex items-center gap-1 text-sm font-semibold text-navy-900 group-hover:text-gold"
          >
            Details <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
