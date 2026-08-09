import { EventCard, type EventCardData } from "@/components/event-card";

/** Renders a responsive grid of event cards, or an empty state. */
export function EventsGrid({ events }: { events: EventCardData[] }) {
  if (events.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No events are currently scheduled. Please check back soon.
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
