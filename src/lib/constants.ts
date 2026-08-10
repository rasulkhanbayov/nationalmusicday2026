// Global, event-independent constants. Per-event details (name, venue, price,
// schedule, artists, program) now live in the Event table — see src/lib/events.ts.

// How long a seat is held during checkout before the reservation expires.
// Must be >= 30 because Stripe Checkout requires `expires_at` to be at least
// 30 minutes out, and we keep the seat hold and the Stripe session in sync.
export const RESERVATION_MINUTES = 30;

// Max seats per single order (seated events only; kept for the seat-map code).
export const MAX_SEATS_PER_ORDER = 10;

// Max tickets in one general-admission order.
export const MAX_TICKETS_PER_ORDER = 10;

// Brand / platform-level details. Commontone is the organizing company that
// presents every event in this catalogue — individual event names (and their
// venues, artists and programmes) live on the Event rows themselves.
export const SITE = {
  name: "Commontone",
  domain: "commontone.de",
  organizer: "Commontone",
  contactEmail: "info@commontone.de",
  tagline: "Cultural events across Germany",
} as const;

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
