import { prisma } from "./prisma";
import { Event, EventStatus, SeatStatus } from "@prisma/client";

export type Artist = {
  name: string;
  role: string;
  bio: string;
  // English variants — fall back to the base field when absent.
  roleEn?: string;
  bioEn?: string;
  // Optional Instagram profile URL — rendered as a link on the artist card.
  instagram?: string;
};
export type ProgramBlock = {
  part: string;
  pieces: { composer: string; title: string }[];
};
// One purchasable ticket type. Events with a single price leave this empty.
export type Tier = {
  name: string;
  priceCents: number;
  note?: string;
  // English variants — fall back to the base fields when absent.
  nameEn?: string;
  noteEn?: string;
};

// A view-model layered over the raw Event row: parsed JSON + formatted dates +
// a denormalized venue object so pages/email/PDF share one shape.
export type EventView = {
  id: string;
  slug: string;
  status: EventStatus;
  name: string;
  nameEn: string | null;
  subtitle: string | null;
  subtitleEn: string | null;
  type: string;
  description: string | null;
  descriptionEn: string | null;
  notice: string | null;
  noticeEn: string | null;
  ticketUrl: string | null;
  isFree: boolean;
  priceCents: number;
  currency: string;
  rows: number;
  seatsPerRow: number;
  capacity: number | null;
  orderPrefix: string;
  doorsTime: string | null;
  startsAt: Date;
  endsAt: Date | null;
  // Formatted helpers
  dateLong: string; // "Saturday, 13 September 2026"
  startTime: string; // "19:00"
  startTimeISO: string;
  endTimeISO: string | null;
  venue: {
    name: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    countryCode: string;
  };
  contactEmail: string | null;
  imageUrl: string | null;
  artists: Artist[];
  program: ProgramBlock[];
  tiers: Tier[];
};

function fmtDateLong(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(d);
}

function fmtTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Berlin",
  }).format(d);
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Maps a raw Event row to the richer EventView used across the app. */
export function toEventView(e: Event): EventView {
  return {
    id: e.id,
    slug: e.slug,
    status: e.status,
    name: e.name,
    nameEn: e.nameEn,
    subtitle: e.subtitle,
    subtitleEn: e.subtitleEn,
    type: e.type,
    description: e.description,
    descriptionEn: e.descriptionEn,
    notice: e.notice,
    noticeEn: e.noticeEn,
    ticketUrl: e.ticketUrl,
    isFree: e.isFree,
    priceCents: e.priceCents,
    currency: e.currency,
    rows: e.rows,
    seatsPerRow: e.seatsPerRow,
    capacity: e.capacity,
    orderPrefix: e.orderPrefix,
    doorsTime: e.doorsTime,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    dateLong: fmtDateLong(e.startsAt),
    startTime: fmtTime(e.startsAt),
    startTimeISO: e.startsAt.toISOString(),
    endTimeISO: e.endsAt ? e.endsAt.toISOString() : null,
    venue: {
      name: e.venueName,
      street: e.venueStreet,
      postalCode: e.venuePostalCode,
      city: e.venueCity,
      country: e.venueCountry,
      countryCode: e.venueCountryCode,
    },
    contactEmail: e.contactEmail,
    imageUrl: e.imageUrl,
    artists: parseJson<Artist[]>(e.artistsJson, []),
    program: parseJson<ProgramBlock[]>(e.programJson, []),
    tiers: parseJson<Tier[]>(e.tiersJson, []),
  };
}

/** How many tickets have been issued for an event (paid orders only). */
export async function ticketsSold(eventId: string): Promise<number> {
  return prisma.ticket.count({ where: { eventId } });
}

/** Remaining tickets, or null when the event has no capacity limit. */
export async function ticketsRemaining(
  eventId: string,
  capacity: number | null,
): Promise<number | null> {
  if (capacity === null) return null;
  return Math.max(0, capacity - (await ticketsSold(eventId)));
}

/** Row letters for an event, e.g. ["A","B",...]. */
export function rowLetters(rows: number): string[] {
  return Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));
}

/** All publicly visible events (published / sold-out / past), soonest first. */
export async function listPublicEvents(): Promise<EventView[]> {
  const events = await prisma.event.findMany({
    where: { status: { in: [EventStatus.PUBLISHED, EventStatus.SOLD_OUT, EventStatus.PAST] } },
    orderBy: { startsAt: "asc" },
  });
  return events.map(toEventView);
}

/** All events (admin), soonest first. */
export async function listAllEvents(): Promise<EventView[]> {
  const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });
  return events.map(toEventView);
}

/** A single event by slug, or null. */
export async function getEventBySlug(slug: string): Promise<EventView | null> {
  const e = await prisma.event.findUnique({ where: { slug } });
  return e ? toEventView(e) : null;
}

/** A single event by id, or null. */
export async function getEventById(id: string): Promise<EventView | null> {
  const e = await prisma.event.findUnique({ where: { id } });
  return e ? toEventView(e) : null;
}

/** Public availability counts for an event card. */
export async function getAvailability(
  eventId: string,
): Promise<{ total: number; sold: number; available: number }> {
  const [total, sold] = await Promise.all([
    prisma.seat.count({ where: { eventId } }),
    prisma.seat.count({ where: { eventId, status: SeatStatus.SOLD } }),
  ]);
  return { total, sold, available: total - sold };
}

/** Public events plus their available-seat count (for card grids). */
export async function listPublicEventsWithAvailability(): Promise<
  (EventView & { available: number })[]
> {
  const events = await listPublicEvents();
  // Sold counts grouped in one query, then merged in memory.
  const sold = await prisma.seat.groupBy({
    by: ["eventId"],
    where: { status: SeatStatus.SOLD },
    _count: { _all: true },
  });
  const soldByEvent = new Map(sold.map((s) => [s.eventId, s._count._all]));
  return events.map((e) => ({
    ...e,
    available:
      e.capacity === null ? Infinity : e.capacity - (soldByEvent.get(e.id) ?? 0),
  }));
}
