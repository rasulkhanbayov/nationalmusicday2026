// Static event details. Single source of truth used across the site,
// emails, tickets and structured data.

export const EVENT = {
  name: "National Music Day 2026",
  subtitle: "Celebrating Azerbaijan's National Music Day",
  type: "Classical Music Concert",
  // ISO date for schema/metadata, plus human-readable variants.
  dateISO: "2026-09-13",
  startTimeISO: "2026-09-13T19:00:00+02:00",
  endTimeISO: "2026-09-13T22:00:00+02:00",
  dateLong: "Saturday, 13 September 2026",
  doorsTime: "18:30",
  startTime: "19:00",
  venue: {
    name: "Einstein Kultur",
    street: "Einsteinstraße 42",
    postalCode: "81675",
    city: "Munich",
    country: "Germany",
    countryCode: "DE",
  },
  capacity: 120,
  organizer: "National Music Day",
  domain: "nationalmusicday2026.com",
  contactEmail: "tickets@nationalmusicday2026.com",
} as const;

// Hall geometry — must match prisma/seed.ts.
export const HALL = {
  rows: "ABCDEFGHIJKL".split(""), // A..L
  seatsPerRow: 10,
  get totalSeats() {
    return this.rows.length * this.seatsPerRow;
  },
} as const;

// How long a seat is held during checkout before the reservation expires.
// Must be >= 30 because Stripe Checkout requires `expires_at` to be at least
// 30 minutes out, and we keep the seat hold and the Stripe session in sync.
export const RESERVATION_MINUTES = 30;

// Max seats per single order (keeps one buyer from holding the whole hall).
export const MAX_SEATS_PER_ORDER = 10;

export const ORDER_PREFIX = "NM2026";

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
