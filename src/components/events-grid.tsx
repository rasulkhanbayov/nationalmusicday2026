"use client";

import { EventCard, type EventCardData } from "@/components/event-card";
import { useLanguage } from "./language-provider";

/** Renders a responsive grid of event cards, or an empty state. */
export function EventsGrid({ events }: { events: EventCardData[] }) {
  const { t } = useLanguage();
  if (events.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        {t.home.noEvents}
      </p>
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}
