import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Clock,
  Ticket as TicketIcon,
  Music2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventSchema } from "@/components/event-schema";
import { EVENT } from "@/lib/constants";
import { ARTISTS, PROGRAM, ABOUT_MUSIC_DAY } from "@/lib/content";
import { getTicketPriceCents, formatEuros } from "@/lib/config";

// Always render with fresh price.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const priceCents = await getTicketPriceCents();

  return (
    <>
      <EventSchema priceEuros={priceCents / 100} />
      <SiteHeader />
      <main>
        <Hero priceCents={priceCents} />
        <QuickFacts />
        <About />
        <AboutMusicDay />
        <Artists />
        <Program />
        <Venue />
        <TicketCta priceCents={priceCents} />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero({ priceCents }: { priceCents: number }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-white">
      {/* Atmospheric gradient backdrop */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950" />
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

      <div className="container flex min-h-[88vh] flex-col items-center justify-center py-24 text-center">
        <span className="section-eyebrow animate-fade-up">
          {EVENT.dateLong} · {EVENT.venue.city}
        </span>
        <h1 className="mt-2 max-w-4xl animate-fade-up font-serif text-5xl font-bold leading-[1.05] sm:text-7xl">
          National Music Day{" "}
          <span className="text-gold">2026</span>
        </h1>
        <p
          className="mt-6 max-w-2xl animate-fade-up text-lg text-white/75 sm:text-xl"
          style={{ animationDelay: "0.1s" }}
        >
          {EVENT.subtitle} — an intimate evening of Azerbaijani classical music
          at {EVENT.venue.name}, Munich.
        </p>

        <div
          className="mt-10 flex animate-fade-up flex-col items-center gap-4 sm:flex-row"
          style={{ animationDelay: "0.2s" }}
        >
          <Button asChild variant="gold" size="lg">
            <Link href="/seats">
              <TicketIcon /> Buy Tickets — {formatEuros(priceCents)}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="#program">
              View Program <ArrowRight />
            </Link>
          </Button>
        </div>

        <p
          className="mt-8 animate-fade-up text-sm text-white/50"
          style={{ animationDelay: "0.3s" }}
        >
          Limited to {EVENT.capacity} seats · Guest checkout, no account needed
        </p>
      </div>
    </section>
  );
}

function QuickFacts() {
  const facts = [
    { icon: CalendarDays, label: "Date", value: EVENT.dateLong },
    {
      icon: Clock,
      label: "Time",
      value: `Doors ${EVENT.doorsTime} · Start ${EVENT.startTime}`,
    },
    {
      icon: MapPin,
      label: "Venue",
      value: `${EVENT.venue.name}, ${EVENT.venue.city}`,
    },
  ];
  return (
    <section className="border-b border-border bg-white">
      <div className="container grid gap-px overflow-hidden rounded-none sm:grid-cols-3">
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

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <span className="section-eyebrow">{eyebrow}</span>
      <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">{title}</h2>
      <div className="gold-rule mt-5" />
    </div>
  );
}

function About() {
  return (
    <section id="about" className="bg-navy-50/40 py-24">
      <div className="container-narrow">
        <SectionHeading eyebrow="About the Event" title="An Evening of Heritage" />
        <div className="mx-auto max-w-3xl space-y-5 text-center text-lg leading-relaxed text-navy-800/90">
          <p>
            Join the Azerbaijani community in Germany and music lovers from
            across Munich for a special concert celebrating Azerbaijan&apos;s
            National Music Day. In the warm acoustics of {EVENT.venue.name},
            our soloists and ensemble present a programme that travels from the
            modal poetry of mugham to the symphonic grandeur of the 20th
            century.
          </p>
          <p>
            With only {EVENT.capacity} seats, the evening is designed to feel
            intimate — close enough to hear every nuance of the tar, every
            breath of the soprano.
          </p>
        </div>
      </div>
    </section>
  );
}

function AboutMusicDay() {
  return (
    <section className="bg-white py-24">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="section-eyebrow">About Azerbaijani Music Day</span>
          <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
            A Living Musical Tradition
          </h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-navy-800/90">
            <p>{ABOUT_MUSIC_DAY}</p>
            <p>
              Tonight, we honour that legacy — and share it with new audiences
              in the heart of Germany.
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 p-px shadow-xl">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-navy-950 text-center">
              <Music2 className="h-16 w-16 text-gold" />
              <p className="mt-4 max-w-xs font-serif text-2xl italic text-white/80">
                &ldquo;Music is the soul of a nation.&rdquo;
              </p>
              <p className="mt-2 text-sm text-gold">— Uzeyir Hajibeyov</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Artists() {
  return (
    <section id="artists" className="bg-navy-50/40 py-24">
      <div className="container">
        <SectionHeading eyebrow="Artists" title="Performers" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ARTISTS.map((a) => (
            <Card key={a.name} className="overflow-hidden">
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-navy-900 to-navy-950">
                <Music2 className="h-10 w-10 text-gold/70" />
              </div>
              <CardContent className="pt-5">
                <h3 className="font-serif text-lg font-semibold text-navy-900">
                  {a.name}
                </h3>
                <p className="text-sm font-medium text-gold">{a.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {a.bio}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Program() {
  return (
    <section id="program" className="bg-white py-24">
      <div className="container-narrow">
        <SectionHeading eyebrow="Program" title="The Evening's Music" />
        <div className="mx-auto max-w-2xl space-y-10">
          {PROGRAM.map((block) => (
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

function Venue() {
  const mapsQuery = encodeURIComponent(
    `${EVENT.venue.name}, ${EVENT.venue.street}, ${EVENT.venue.postalCode} ${EVENT.venue.city}`,
  );
  return (
    <section id="venue" className="bg-navy-50/40 py-24">
      <div className="container grid items-stretch gap-10 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <span className="section-eyebrow">Venue</span>
          <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
            {EVENT.venue.name}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-navy-800/90">
            A cultural venue in the heart of Munich, {EVENT.venue.name} offers
            an intimate concert hall with seating for up to {EVENT.capacity}{" "}
            guests — the perfect setting for an evening of chamber music.
          </p>
          <div className="mt-6 space-y-1 text-navy-800">
            <p className="font-medium">{EVENT.venue.name}</p>
            <p>{EVENT.venue.street}</p>
            <p>
              {EVENT.venue.postalCode} {EVENT.venue.city}, {EVENT.venue.country}
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
            title={`Map to ${EVENT.venue.name}`}
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

function TicketCta({ priceCents }: { priceCents: number }) {
  return (
    <section id="tickets" className="relative isolate overflow-hidden bg-navy-950 py-24 text-white">
      <div className="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div className="container-narrow text-center">
        <span className="section-eyebrow">Tickets</span>
        <h2 className="text-3xl font-bold sm:text-4xl">
          Reserve Your Seat
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
          Choose your seats on our interactive map. Tickets are{" "}
          {formatEuros(priceCents)} each, with secure payment and instant
          delivery of PDF tickets to your inbox.
        </p>
        <div className="mt-8">
          <Button asChild variant="gold" size="lg">
            <Link href="/seats">
              <TicketIcon /> Choose Seats
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-white/50">
          Only {EVENT.capacity} seats available · No account required
        </p>
      </div>
    </section>
  );
}
