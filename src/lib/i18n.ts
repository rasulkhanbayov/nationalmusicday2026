// Lightweight two-locale dictionary (EN / DE).
//
// The site chrome and section headings are translated here. Event *content*
// (name, description, artists) lives on the Event row and is authored in one
// language by the organiser — see EventView. Only UI strings belong in here.

// Cookie that stores the visitor's chosen language. Defined here (a plain
// module) rather than in the client provider, so server components can import
// it — values exported from a "use client" module are not readable on the
// server.
export const LOCALE_COOKIE = "locale";

export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

// Every key must exist in both locales — the Dict type enforces that at build
// time, so a missing translation is a type error rather than a blank string.
type Dict = {
  nav: { home: string; events: string; browseEvents: string; menu: string; close: string };
  footer: { explore: string; contact: string; tagline: string; rights: string };
  home: { heroLead: string; upcoming: string; upcomingSub: string; noEvents: string };
  events: {
    title: string;
    subtitle: string;
    details: string;
    ticketsAvailable: string;
    comingSoon: string;
    soldOut: string;
    ended: string;
    free: string;
    from: string;
  };
  event: {
    allEvents: string;
    aboutEyebrow: string;
    aboutTitle: string;
    artistsEyebrow: string;
    artistsTitle: string;
    programEyebrow: string;
    programTitle: string;
    heritageEyebrow: string;
    heritageTitle: string;
    heritageP1: string;
    heritageP2: string;
    ticketsEyebrow: string;
    ticketsTitle: string;
    ticketsTitleFree: string;
    venueEyebrow: string;
    openInMaps: string;
    date: string;
    time: string;
    venue: string;
    doors: string;
    start: string;
    freeAdmission: string;
    perTicket: string;
    caption: string;
    supporter: string;
    // CTA labels
    buyTickets: string;
    reserveFree: string;
    comingSoon: string;
    soldOut: string;
    ended: string;
    // CTA blurbs
    blurbPast: string;
    blurbSoldOut: string;
    blurbNoUrl: string;
    blurbFree: string;
    blurbTiers: string;
    blurbSingle: string;
  };
  notFound: { title: string; body: string; home: string; events: string };
  checkout: {
    heading: string;
    sub: string;
    yourDetails: string;
    firstName: string;
    lastName: string;
    email: string;
    emailHint: string;
    phone: string;
    total: string;
    ticket: string;
    tickets: string;
    payNow: string;
    redirecting: string;
    securedByStripe: string;
    pickOne: string;
    failed: string;
    network: string;
    increase: string;
    decrease: string;
    cancelled: string;
  };
};

const en: Dict = {
  nav: {
    home: "Home",
    events: "Events",
    browseEvents: "Browse Events",
    menu: "Open menu",
    close: "Close menu",
  },
  footer: {
    explore: "Explore",
    contact: "Contact",
    tagline: "Cultural events across Germany",
    rights: "All rights reserved.",
  },
  home: {
    heroLead:
      "Concerts and recitals in the heart of Germany, presented by Commontone. Browse upcoming events and reserve your seat.",
    upcoming: "Upcoming Events",
    upcomingSub: "Concerts and recitals presented by Commontone.",
    noEvents: "No events are on sale right now. Please check back soon.",
  },
  events: {
    title: "Events",
    subtitle: "Concerts and recitals presented by Commontone.",
    details: "Details",
    ticketsAvailable: "Tickets available",
    comingSoon: "Coming soon",
    soldOut: "Sold out",
    ended: "Ended",
    free: "Free",
    from: "from",
  },
  event: {
    allEvents: "All Events",
    aboutEyebrow: "About the Event",
    aboutTitle: "An Evening of Heritage",
    artistsEyebrow: "Artists",
    artistsTitle: "Performers",
    programEyebrow: "Program",
    programTitle: "The Evening's Music",
    heritageEyebrow: "Heritage",
    heritageTitle: "Where Europe Meets Asia",
    heritageP1:
      "The tar, the kamancheh and the daf carry a musical language shaped over centuries at the crossroads of two continents. Alongside them stand the composers who brought that language to the concert hall.",
    heritageP2:
      "Our programme moves between both worlds — traditional folk melodies and the works of Azerbaijan's classical composers.",
    ticketsEyebrow: "Admission",
    ticketsTitle: "Get Your Tickets",
    ticketsTitleFree: "Reserve Your Place",
    venueEyebrow: "Venue",
    openInMaps: "Open in Maps",
    date: "Date",
    time: "Time",
    venue: "Venue",
    doors: "Doors",
    start: "Start",
    freeAdmission: "Free admission",
    perTicket: "per ticket",
    caption: "Performers — the living roots of the evening's programme.",
    supporter: "Supporter",
    buyTickets: "Buy Tickets",
    reserveFree: "Reserve Your Free Place",
    comingSoon: "Tickets Coming Soon",
    soldOut: "Sold Out",
    ended: "Event Ended",
    blurbPast:
      "This event has already taken place. Browse our upcoming concerts for what's next.",
    blurbSoldOut:
      "This event is sold out. Browse our upcoming concerts for what's next.",
    blurbNoUrl:
      "Tickets for this event are not on sale yet. Check back soon for booking details.",
    blurbFree:
      "Admission is free, but places are limited. Reserve yours through our ticketing partner.",
    blurbTiers:
      "Choose the ticket that suits you below — both admit one person to the full concert. Booking runs through our ticketing partner.",
    blurbSingle: "Tickets are booked through our ticketing partner.",
  },
  checkout: {
    heading: "Tickets",
    sub: "Choose your tickets. Admission is open seating — your QR tickets arrive by email straight after payment.",
    yourDetails: "Your details",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    emailHint: "Your tickets will be sent to this address.",
    phone: "Phone (optional)",
    total: "Total",
    ticket: "ticket",
    tickets: "tickets",
    payNow: "Continue to payment",
    redirecting: "Redirecting…",
    securedByStripe: "Payments are processed securely by Stripe.",
    pickOne: "Please select at least one ticket.",
    failed: "Checkout could not be started",
    network: "Network error — please try again.",
    increase: "Add one",
    decrease: "Remove one",
    cancelled: "Payment was cancelled — no tickets were purchased and you have not been charged.",
  },
  notFound: {
    title: "Page Not Found",
    body: "The page you are looking for does not exist or has moved.",
    home: "Back to Home",
    events: "Browse Events",
  },
};

const de: Dict = {
  nav: {
    home: "Startseite",
    events: "Konzerte",
    browseEvents: "Konzerte ansehen",
    menu: "Menü öffnen",
    close: "Menü schließen",
  },
  footer: {
    explore: "Entdecken",
    contact: "Kontakt",
    tagline: "Kulturveranstaltungen in ganz Deutschland",
    rights: "Alle Rechte vorbehalten.",
  },
  home: {
    heroLead:
      "Konzerte und Recitals im Herzen Deutschlands, präsentiert von Commontone. Entdeckt kommende Veranstaltungen und sichert euch euren Platz.",
    upcoming: "Kommende Veranstaltungen",
    upcomingSub: "Konzerte und Recitals, präsentiert von Commontone.",
    noEvents:
      "Derzeit sind keine Veranstaltungen im Verkauf. Schaut bald wieder vorbei.",
  },
  events: {
    title: "Veranstaltungen",
    subtitle: "Konzerte und Recitals, präsentiert von Commontone.",
    details: "Details",
    ticketsAvailable: "Tickets verfügbar",
    comingSoon: "Demnächst",
    soldOut: "Ausverkauft",
    ended: "Beendet",
    free: "Kostenlos",
    from: "ab",
  },
  event: {
    allEvents: "Alle Veranstaltungen",
    aboutEyebrow: "Über das Konzert",
    aboutTitle: "Ein Abend voller Kultur",
    artistsEyebrow: "Künstler",
    artistsTitle: "Mitwirkende",
    programEyebrow: "Programm",
    programTitle: "Die Musik des Abends",
    heritageEyebrow: "Tradition",
    heritageTitle: "Wo Europa auf Asien trifft",
    heritageP1:
      "Tar, Kamancheh und Daf tragen eine Klangsprache, die über Jahrhunderte an der Schnittstelle zweier Kontinente gewachsen ist. Neben ihnen stehen die Komponisten, die diese Sprache in den Konzertsaal gebracht haben.",
    heritageP2:
      "Unser Programm bewegt sich zwischen beiden Welten — traditionellen Volksmelodien und den Werken aserbaidschanischer Komponisten.",
    ticketsEyebrow: "Eintritt",
    ticketsTitle: "Tickets sichern",
    ticketsTitleFree: "Platz reservieren",
    venueEyebrow: "Veranstaltungsort",
    openInMaps: "In Maps öffnen",
    date: "Datum",
    time: "Uhrzeit",
    venue: "Ort",
    doors: "Einlass",
    start: "Beginn",
    freeAdmission: "Eintritt frei",
    perTicket: "pro Ticket",
    caption: "Musiker — die lebendigen Wurzeln des Programms.",
    supporter: "Unterstützer",
    buyTickets: "Tickets kaufen",
    reserveFree: "Kostenlos reservieren",
    comingSoon: "Tickets bald verfügbar",
    soldOut: "Ausverkauft",
    ended: "Veranstaltung beendet",
    blurbPast:
      "Diese Veranstaltung hat bereits stattgefunden. Entdeckt unsere kommenden Konzerte.",
    blurbSoldOut:
      "Diese Veranstaltung ist ausverkauft. Entdeckt unsere kommenden Konzerte.",
    blurbNoUrl:
      "Der Ticketverkauf für diese Veranstaltung hat noch nicht begonnen. Schaut bald wieder vorbei.",
    blurbFree:
      "Der Eintritt ist frei, die Plätze sind jedoch begrenzt. Reserviert euren Platz über unseren Ticketpartner.",
    blurbTiers:
      "Wählt unten das passende Ticket — beide berechtigen eine Person zum Besuch des gesamten Konzerts. Die Buchung läuft über unseren Ticketpartner.",
    blurbSingle: "Tickets werden über unseren Ticketpartner gebucht.",
  },
  checkout: {
    heading: "Tickets",
    sub: "Wählt eure Tickets. Es gibt freie Platzwahl — eure QR-Tickets erhaltet ihr direkt nach der Zahlung per E-Mail.",
    yourDetails: "Eure Daten",
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail",
    emailHint: "An diese Adresse werden eure Tickets gesendet.",
    phone: "Telefon (optional)",
    total: "Gesamt",
    ticket: "Ticket",
    tickets: "Tickets",
    payNow: "Weiter zur Zahlung",
    redirecting: "Weiterleitung…",
    securedByStripe: "Die Zahlung wird sicher über Stripe abgewickelt.",
    pickOne: "Bitte wählt mindestens ein Ticket aus.",
    failed: "Bezahlvorgang konnte nicht gestartet werden",
    network: "Netzwerkfehler — bitte erneut versuchen.",
    increase: "Eins hinzufügen",
    decrease: "Eins entfernen",
    cancelled: "Die Zahlung wurde abgebrochen — es wurden keine Tickets gekauft und es wurde nichts abgebucht.",
  },
  notFound: {
    title: "Seite nicht gefunden",
    body: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    home: "Zur Startseite",
    events: "Konzerte ansehen",
  },
};

const DICTS: Record<Locale, Dict> = { en, de };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "en" || v === "de";
}

/** Locale-aware currency formatting (de-DE uses "21,90 €"). */
export function formatPrice(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Locale-aware long date, e.g. "Samstag, 13. September 2026". */
export function formatDateLong(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(d);
}
