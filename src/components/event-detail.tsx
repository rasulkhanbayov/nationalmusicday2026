import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  MapPin,
  Clock,
  Ticket as TicketIcon,
  Music2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { priceLabel } from "@/lib/config";
import type { EventView } from "@/lib/events";

// Full event detail page body (hero → facts → about → artists → program →
// venue → CTA), driven entirely by an EventView. Shared shape for any event.
export function EventDetail({
  event,
  available,
}: {
  event: EventView;
  available: number;
}) {
  // Sales happen on our ticketing partner's site, so local seat counts no
  // longer track reality. Set an event's status to SOLD_OUT in the admin to
  // mark it sold out; the seat-count check only matters if the built-in
  // booking flow is re-enabled.
  const soldOut = available <= 0 || event.status === "SOLD_OUT";
  const isPast = event.status === "PAST";

  return (
    <>
      <Hero event={event} soldOut={soldOut} isPast={isPast} />
      <QuickFacts event={event} />
      {event.description ? <About event={event} /> : null}
      {event.artists.length > 0 ? <Artists event={event} /> : null}
      {event.tiers.length > 1 ? (
        <Tiers event={event} soldOut={soldOut} isPast={isPast} />
      ) : null}
      {event.program.length > 0 ? <Program event={event} /> : null}
      <Heritage />
      <Venue event={event} />
      <TicketCta event={event} soldOut={soldOut} isPast={isPast} />
    </>
  );
}

function ctaLabel(event: EventView, soldOut: boolean, isPast: boolean) {
  if (isPast) return "Event Ended";
  if (soldOut) return "Sold Out";
  if (!event.ticketUrl) return "Tickets Coming Soon";
  if (event.isFree) return "Reserve Your Free Place";
  const price = priceLabel(false, entryPriceCents(event));
  return event.tiers.length > 1
    ? `Buy Tickets — from ${price}`
    : `Buy Tickets — ${price}`;
}

/** Lowest tier price, falling back to the event's own price. */
function entryPriceCents(event: EventView): number {
  if (event.tiers.length === 0) return event.priceCents;
  return Math.min(...event.tiers.map((t) => t.priceCents));
}

function ctaBlurb(event: EventView, soldOut: boolean, isPast: boolean): string {
  if (isPast) return "This event has already taken place. Browse our upcoming concerts for what's next.";
  if (soldOut) return "This event is sold out. Browse our upcoming concerts for what's next.";
  if (!event.ticketUrl)
    return "Tickets for this event are not on sale yet. Check back soon for booking details.";
  if (event.isFree)
    return "Admission is free, but places are limited. Reserve yours through our ticketing partner.";
  return event.tiers.length > 1
    ? "Choose the ticket that suits you below — both admit one person to the full concert. Booking runs through our ticketing partner."
    : `Tickets are ${priceLabel(false, event.priceCents)} each and are booked through our ticketing partner.`;
}

/**
 * The primary ticket CTA. Tickets are sold on an external site, so this is an
 * outbound link rather than an internal route. When the event has no ticketUrl
 * (or is sold out / past) it renders as a disabled button instead of a dead
 * link.
 */
function TicketButton({
  event,
  soldOut,
  isPast,
  label,
}: {
  event: EventView;
  soldOut: boolean;
  isPast: boolean;
  label?: string;
}) {
  const disabled = soldOut || isPast || !event.ticketUrl;
  const text = label && !disabled ? label : ctaLabel(event, soldOut, isPast);

  if (disabled) {
    return (
      <Button variant="gold" size="lg" disabled>
        <span>
          <TicketIcon /> {text}
        </span>
      </Button>
    );
  }

  return (
    <Button asChild variant="gold" size="lg">
      <a href={event.ticketUrl!} target="_blank" rel="noopener noreferrer">
        <TicketIcon /> {text} <ExternalLink />
      </a>
    </Button>
  );
}

function Hero({
  event,
  soldOut,
  isPast,
}: {
  event: EventView;
  soldOut: boolean;
  isPast: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-white">
      <div className="absolute inset-0 -z-10">
        {/* Event artwork, dimmed behind a navy wash so text stays legible. */}
        {event.imageUrl ? (
          <>
            <Image
              src={event.imageUrl}
              alt=""
              aria-hidden
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-950/85 to-navy-950" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950" />
        )}
        <div className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container flex min-h-[78vh] flex-col items-center justify-center py-24 text-center">
        <span className="section-eyebrow animate-fade-up">
          {event.dateLong} · {event.venue.city}
        </span>
        <h1 className="mt-2 max-w-4xl animate-fade-up font-serif text-4xl font-bold leading-[1.05] sm:text-6xl">
          {event.name}
        </h1>
        {event.subtitle ? (
          <p
            className="mt-6 max-w-2xl animate-fade-up text-lg text-white/75 sm:text-xl"
            style={{ animationDelay: "0.1s" }}
          >
            {event.subtitle}
          </p>
        ) : null}

        <div
          className="mt-10 flex animate-fade-up flex-col items-center gap-4 sm:flex-row"
          style={{ animationDelay: "0.2s" }}
        >
          <TicketButton event={event} soldOut={soldOut} isPast={isPast} />
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/events">
              All Events <ArrowRight />
            </Link>
          </Button>
        </div>

        <p
          className="mt-8 animate-fade-up text-sm text-white/50"
          style={{ animationDelay: "0.3s" }}
        >
          {event.isFree
            ? "Free admission"
            : event.tiers.length > 1
              ? `from ${priceLabel(false, entryPriceCents(event))}`
              : `${priceLabel(false, event.priceCents)} per ticket`}{" "}
          · Doors {event.doorsTime ?? event.startTime} · {event.venue.name}
        </p>
      </div>
    </section>
  );
}

function QuickFacts({ event }: { event: EventView }) {
  const timing = event.doorsTime
    ? `Doors ${event.doorsTime} · Start ${event.startTime}`
    : `Start ${event.startTime}`;
  const facts = [
    { icon: CalendarDays, label: "Date", value: event.dateLong },
    { icon: Clock, label: "Time", value: timing },
    {
      icon: MapPin,
      label: "Venue",
      value: `${event.venue.name}, ${event.venue.city}`,
    },
  ];
  return (
    <section className="border-b border-border bg-white">
      <div className="container grid gap-px sm:grid-cols-3">
        {facts.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-4 py-8 sm:justify-center"
          >
            <f.icon className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {f.label}
              </p>
              <p className="font-medium text-navy-900">{f.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <span className="section-eyebrow">{eyebrow}</span>
      <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">{title}</h2>
      <div className="gold-rule mt-5" />
    </div>
  );
}

function About({ event }: { event: EventView }) {
  const paragraphs = event.description!.split("\n").filter((p) => p.trim());
  return (
    <section className="relative overflow-hidden bg-navy-50/40 py-24">
      <div className="container">
        <SectionHeading eyebrow="About the Event" title="An Evening of Heritage" />
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 text-lg leading-relaxed text-navy-800/90">
            {/* Drop cap on the opening paragraph for an editorial feel. */}
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.85] first-letter:text-gold"
                    : undefined
                }
              >
                {p}
              </p>
            ))}
          </div>
          <figure className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <Image
              src="/images/folk-musicians.jpeg"
              alt="Painting of Azerbaijani folk musicians playing traditional wind and percussion instruments"
              width={736}
              height={651}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="h-auto w-full object-cover"
            />
            <figcaption className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
              Traditional Azerbaijani musicians — the living roots of the
              evening&rsquo;s programme.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Artists({ event }: { event: EventView }) {
  return (
    <section className="bg-white py-24">
      <div className="container">
        <SectionHeading eyebrow="Artists" title="Performers" />
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {event.artists.map((a) => (
            <Card
              key={a.name}
              className="group overflow-hidden text-center transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg"
            >
              <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950">
                <div className="absolute inset-0 bg-gold/0 transition-colors group-hover:bg-gold/5" />
                <Music2 className="h-9 w-9 text-gold/70 transition-transform group-hover:scale-110" />
              </div>
              <CardContent className="pt-5">
                <h3 className="font-serif text-lg font-semibold text-navy-900">
                  {a.name}
                </h3>
                <div className="mx-auto my-2 h-px w-8 bg-gold/40" />
                <p className="text-sm font-medium uppercase tracking-wider text-gold">
                  {a.role}
                </p>
                {a.bio ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {a.bio}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Ticket tiers — shown when an event sells more than one ticket type. */
function Tiers({
  event,
  soldOut,
  isPast,
}: {
  event: EventView;
  soldOut: boolean;
  isPast: boolean;
}) {
  const cheapest = entryPriceCents(event);
  return (
    <section className="relative overflow-hidden bg-navy-50/40 py-24">
      <div className="container-narrow">
        <SectionHeading eyebrow="Eintritt" title="Tickets" />
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {event.tiers.map((t) => {
            const isEntry = t.priceCents === cheapest;
            return (
              <Card
                key={t.name}
                className={`relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isEntry ? "border-gold/50" : ""
                }`}
              >
                {!isEntry ? (
                  <span className="absolute right-4 top-4 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-dark">
                    Supporter
                  </span>
                ) : null}
                <CardContent className="pt-7">
                  <h3 className="font-serif text-xl font-semibold text-navy-900">
                    {t.name}
                  </h3>
                  <p className="mt-4 font-serif text-4xl font-bold text-navy-900">
                    {priceLabel(false, t.priceCents)}
                  </p>
                  {t.note ? (
                    <p className="mt-2 text-sm text-muted-foreground">{t.note}</p>
                  ) : null}
                  <div className="gold-rule mt-6" />
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-10 flex justify-center">
          <TicketButton event={event} soldOut={soldOut} isPast={isPast} />
        </div>
      </div>
    </section>
  );
}

function Program({ event }: { event: EventView }) {
  return (
    <section className="bg-navy-50/40 py-24">
      <div className="container-narrow">
        <SectionHeading eyebrow="Program" title="The Evening's Music" />
        <div className="mx-auto max-w-2xl space-y-10">
          {event.program.map((block) => (
            <div key={block.part}>
              <h3 className="mb-4 flex items-center gap-3 font-serif text-xl font-semibold text-navy-900">
                <span className="text-gold">◆</span> {block.part}
              </h3>
              <ul className="space-y-3 border-l-2 border-gold/30 pl-6">
                {block.pieces.map((p, i) => (
                  <li key={i} className="flex flex-col">
                    {p.composer && (
                      <span className="text-sm font-medium text-gold">
                        {p.composer}
                      </span>
                    )}
                    <span className="text-navy-800">{p.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Venue({ event }: { event: EventView }) {
  const mapsQuery = encodeURIComponent(
    `${event.venue.name}, ${event.venue.street}, ${event.venue.postalCode} ${event.venue.city}`,
  );
  return (
    <section className="bg-white py-24">
      <div className="container grid items-stretch gap-10 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <span className="section-eyebrow">Venue</span>
          <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
            {event.venue.name}
          </h2>
          <div className="mt-6 space-y-1 text-navy-800">
            <p className="font-medium">{event.venue.name}</p>
            <p>{event.venue.street}</p>
            <p>
              {event.venue.postalCode} {event.venue.city}, {event.venue.country}
            </p>
          </div>
          <div className="mt-6">
            <Button asChild variant="outline">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin /> Open in Maps
              </a>
            </Button>
          </div>
        </div>
        <div className="min-h-[320px] overflow-hidden rounded-2xl border border-border shadow-sm">
          <iframe
            title={`Map to ${event.venue.name}`}
            className="h-full min-h-[320px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed`}
          />
        </div>
      </div>
    </section>
  );
}

/** Editorial band pairing the instruments/composers artwork with context. */
function Heritage() {
  return (
    <section className="bg-white py-24">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <figure className="order-2 overflow-hidden rounded-2xl bg-navy-50/40 lg:order-1">
          <Image
            src="/images/instruments-composers.jpeg"
            alt="Traditional Azerbaijani instruments — tar, kamancheh and daf — layered over portraits of the country's classical composers"
            width={500}
            height={433}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="h-auto w-full object-contain"
          />
        </figure>
        <div className="order-1 lg:order-2">
          <span className="section-eyebrow">Heritage</span>
          <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
            Where Europe Meets Asia
          </h2>
          <div className="gold-rule mt-5" />
          <p className="mt-6 text-lg leading-relaxed text-navy-800/90">
            The tar, the kamancheh and the daf carry a musical language shaped
            over centuries at the crossroads of two continents. Alongside them
            stand the composers who brought that language to the concert hall.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-navy-800/90">
            Our programme moves between both worlds — traditional folk melodies
            and the works of Azerbaijan&rsquo;s classical composers.
          </p>
        </div>
      </div>
    </section>
  );
}

function TicketCta({
  event,
  soldOut,
  isPast,
}: {
  event: EventView;
  soldOut: boolean;
  isPast: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 py-24 text-white">
      <div className="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div className="container-narrow text-center">
        <span className="section-eyebrow">Tickets</span>
        <h2 className="text-3xl font-bold sm:text-4xl">
          {event.isFree ? "Reserve Your Place" : "Get Your Tickets"}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
          {ctaBlurb(event, soldOut, isPast)}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <TicketButton event={event} soldOut={soldOut} isPast={isPast} />
        </div>
      </div>
    </section>
  );
}
