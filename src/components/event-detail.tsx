"use client";

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
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EventView } from "@/lib/events";
import { useLanguage } from "./language-provider";
import { TicketPurchase } from "./ticket-purchase";

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
  const soldOut = event.status === "SOLD_OUT";
  const isPast = event.status === "PAST";
  // Tickets are only purchasable for a live, non-sold-out event.
  const canBuy = !soldOut && !isPast;

  return (
    <>
      <Hero event={event} soldOut={soldOut} isPast={isPast} />
      <QuickFacts event={event} />
      {event.description ? <About event={event} /> : null}
      {event.artists.length > 0 ? <Artists event={event} /> : null}
      {canBuy ? <Tickets event={event} /> : null}
      {event.program.length > 0 ? <Program event={event} /> : null}
      <Poster event={event} />
      <Heritage />
      <Venue event={event} />
      <TicketCta event={event} soldOut={soldOut} isPast={isPast} />
    </>
  );
}

type T = ReturnType<typeof useLanguage>["t"];

function ctaLabel(
  event: EventView,
  soldOut: boolean,
  isPast: boolean,
  t: T,
  price: (c: number) => string,
) {
  if (isPast) return t.event.ended;
  if (soldOut) return t.event.soldOut;
  if (event.isFree) return t.event.reserveFree;
  const p = price(entryPriceCents(event));
  return event.tiers.length > 1
    ? `${t.event.buyTickets} — ${t.events.from} ${p}`
    : `${t.event.buyTickets} — ${p}`;
}

/** Lowest tier price, falling back to the event's own price. */
function entryPriceCents(event: EventView): number {
  if (event.tiers.length === 0) return event.priceCents;
  return Math.min(...event.tiers.map((t) => t.priceCents));
}

function ctaBlurb(
  event: EventView,
  soldOut: boolean,
  isPast: boolean,
  t: T,
): string {
  if (isPast) return t.event.blurbPast;
  if (soldOut) return t.event.blurbSoldOut;
  return t.checkout.sub;
}

/**
 * The primary ticket CTA. Tickets are sold on this site via Stripe, so the
 * button scrolls down to the purchase form. Sold-out and past events render a
 * disabled button instead.
 */
function TicketButton({
  event,
  soldOut,
  isPast,
}: {
  event: EventView;
  soldOut: boolean;
  isPast: boolean;
}) {
  const { t, price } = useLanguage();
  const disabled = soldOut || isPast;
  const text = ctaLabel(event, soldOut, isPast, t, price);

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
      <a href="#tickets">
        <TicketIcon /> {text}
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
  const { t, price, dateLong, content } = useLanguage();
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
          {dateLong(event.startsAt)} · {event.venue.city}
        </span>
        <h1 className="mt-2 max-w-4xl animate-fade-up font-serif text-4xl font-bold leading-[1.05] sm:text-6xl">
          {content(event.name, event.nameEn)}
        </h1>
        {event.subtitle ? (
          <p
            className="mt-6 max-w-2xl animate-fade-up text-lg text-white/75 sm:text-xl"
            style={{ animationDelay: "0.1s" }}
          >
            {content(event.subtitle, event.subtitleEn)}
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
              {t.event.allEvents} <ArrowRight />
            </Link>
          </Button>
        </div>

        <p
          className="mt-8 animate-fade-up text-sm text-white/50"
          style={{ animationDelay: "0.3s" }}
        >
          {event.isFree
            ? t.event.freeAdmission
            : event.tiers.length > 1
              ? `${t.events.from} ${price(entryPriceCents(event))}`
              : `${price(event.priceCents)} ${t.event.perTicket}`}{" "}
          · {t.event.doors} {event.doorsTime ?? event.startTime} ·{" "}
          {content(event.venue.name, event.venue.nameEn)}
        </p>
      </div>
    </section>
  );
}

function QuickFacts({ event }: { event: EventView }) {
  const { t, dateLong, content } = useLanguage();
  const timing = event.doorsTime
    ? `${t.event.doors} ${event.doorsTime} · ${t.event.start} ${event.startTime}`
    : `${t.event.start} ${event.startTime}`;
  const facts = [
    { icon: CalendarDays, label: t.event.date, value: dateLong(event.startsAt) },
    { icon: Clock, label: t.event.time, value: timing },
    {
      icon: MapPin,
      label: t.event.venue,
      value: `${content(event.venue.name, event.venue.nameEn)}, ${event.venue.city}`,
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
  const { t, content } = useLanguage();
  const paragraphs = content(event.description, event.descriptionEn)
    .split("\n")
    .filter((p) => p.trim());
  return (
    <section className="relative overflow-hidden bg-navy-50/40 py-24">
      <div className="container">
        <SectionHeading
          eyebrow={t.event.aboutEyebrow}
          title={t.event.aboutTitle}
        />
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
              src="/images/mugham-ensemble.jpeg"
              alt="Painting of musicians playing daf, tar and kamancheh"
              width={700}
              height={618}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="h-auto w-full object-cover"
            />
            <figcaption className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
              {t.event.caption}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/** "https://www.instagram.com/name/?x=1" → "@name" for display. */
function instagramHandle(url: string): string {
  const path = url.split("?")[0].replace(/\/+$/, "");
  const handle = path.slice(path.lastIndexOf("/") + 1);
  return handle ? `@${handle}` : "Instagram";
}

function Artists({ event }: { event: EventView }) {
  const { t, content } = useLanguage();
  return (
    <section className="bg-white py-24">
      <div className="container">
        <SectionHeading
          eyebrow={t.event.artistsEyebrow}
          title={t.event.artistsTitle}
        />
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
                  {content(a.role, a.roleEn)}
                </p>
                {a.bio ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {content(a.bio, a.bioEn)}
                  </p>
                ) : null}
                {a.instagram ? (
                  <a
                    href={a.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:border-gold/50 hover:bg-gold/5 hover:text-gold-dark"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    {instagramHandle(a.instagram)}
                  </a>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Ticket purchase — quantity per ticket type, then Stripe Checkout. */
function Tickets({ event }: { event: EventView }) {
  const { t } = useLanguage();
  return (
    <section id="tickets" className="relative overflow-hidden bg-navy-50/40 py-24">
      <div className="container">
        <SectionHeading
          eyebrow={t.event.ticketsEyebrow}
          title={t.checkout.heading}
        />
        <p className="mx-auto -mt-6 mb-10 max-w-2xl text-center text-muted-foreground">
          {t.checkout.sub}
        </p>
        <TicketPurchase event={event} />
      </div>
    </section>
  );
}

function Program({ event }: { event: EventView }) {
  const { t } = useLanguage();
  return (
    <section className="bg-navy-50/40 py-24">
      <div className="container-narrow">
        <SectionHeading
          eyebrow={t.event.programEyebrow}
          title={t.event.programTitle}
        />
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
  const { t, content } = useLanguage();
  const venueName = content(event.venue.name, event.venue.nameEn);
  // Drop any hall/room suffix (e.g. "— Halle 1 & 2") before geocoding: Google
  // finds the building, not the room, and the extra text breaks the lookup.
  const mapsVenue = venueName.split(/\s+[—–-]\s+/)[0];
  const mapsQuery = encodeURIComponent(
    `${mapsVenue}, ${event.venue.street}, ${event.venue.postalCode} ${event.venue.city}`,
  );
  return (
    <section className="bg-white py-24">
      <div className="container grid items-stretch gap-10 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <span className="section-eyebrow">{t.event.venueEyebrow}</span>
          <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
            {venueName}
          </h2>
          <div className="mt-6 space-y-1 text-navy-800">
            <p className="font-medium">{venueName}</p>
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
                <MapPin /> {t.event.openInMaps}
              </a>
            </Button>
          </div>
        </div>
        <div className="min-h-[320px] overflow-hidden rounded-2xl border border-border shadow-sm">
          <iframe
            title={`Map to ${venueName}`}
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

/**
 * The event poster, shown whole rather than cropped. Portrait print artwork,
 * so it is width-capped and centred; clicking opens the full-resolution file
 * in a new tab for anyone who wants to print or share it.
 */
function Poster({ event }: { event: EventView }) {
  const { t } = useLanguage();
  if (!event.posterUrl) return null;
  return (
    <section className="bg-white py-24">
      <div className="container">
        <SectionHeading
          eyebrow={t.event.posterEyebrow}
          title={t.event.posterTitle}
        />
        <div className="mx-auto max-w-[520px]">
          <a
            href={event.posterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block overflow-hidden rounded-2xl border border-border shadow-sm transition-shadow hover:shadow-xl"
          >
            <Image
              src={event.posterUrl}
              alt={`${event.name} — event poster`}
              width={1448}
              height={2048}
              sizes="(min-width: 640px) 520px, 100vw"
              className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </a>
          <p className="mt-4 text-center">
            <a
              href={event.posterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-800 hover:text-gold"
            >
              {t.event.posterView} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Editorial band pairing the instruments/composers artwork with context. */
function Heritage() {
  const { t } = useLanguage();
  return (
    <section className="bg-white py-24">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <figure className="order-2 overflow-hidden rounded-2xl bg-navy-50/40 lg:order-1">
          <Image
            src="/images/instruments-composers.jpeg"
            alt="Musical instruments — tar, kamancheh and daf — layered over portraits of composers"
            width={500}
            height={433}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="h-auto w-full object-contain"
          />
        </figure>
        <div className="order-1 lg:order-2">
          <span className="section-eyebrow">{t.event.heritageEyebrow}</span>
          <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
            {t.event.heritageTitle}
          </h2>
          <div className="gold-rule mt-5" />
          <p className="mt-6 text-lg leading-relaxed text-navy-800/90">
            {t.event.heritageP1}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-navy-800/90">
            {t.event.heritageP2}
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
  const { t } = useLanguage();
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 py-24 text-white">
      <div className="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div className="container-narrow text-center">
        <span className="section-eyebrow">{t.event.ticketsEyebrow}</span>
        <h2 className="text-3xl font-bold sm:text-4xl">
          {event.isFree ? t.event.ticketsTitleFree : t.event.ticketsTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
          {ctaBlurb(event, soldOut, isPast, t)}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <TicketButton event={event} soldOut={soldOut} isPast={isPast} />
        </div>
      </div>
    </section>
  );
}
