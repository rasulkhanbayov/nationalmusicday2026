import { SITE, siteUrl } from "@/lib/constants";
import type { EventView } from "@/lib/events";

/** Injects schema.org MusicEvent structured data for one event. */
export function EventSchema({
  event,
  locale = "de",
}: {
  event: EventView;
  locale?: string;
}) {
  const pick = (base: string | null, en: string | null) =>
    (locale === "en" ? en?.trim() || base : base) ?? "";
  const name = pick(event.name, event.nameEn);
  const url = siteUrl();
  const eventUrl = `${url}/events/${event.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name,
    inLanguage: locale,
    description:
      pick(event.subtitle, event.subtitleEn) ||
      pick(event.description, event.descriptionEn) ||
      name,
    startDate: event.startTimeISO,
    endDate: event.endTimeISO || undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: [`${url}/og-image.png`],
    url: eventUrl,
    location: {
      "@type": "Place",
      name: event.venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venue.street,
        postalCode: event.venue.postalCode,
        addressLocality: event.venue.city,
        addressCountry: event.venue.countryCode,
      },
    },
    organizer: {
      "@type": "Organization",
      name: SITE.organizer,
      url,
    },
    offers: {
      "@type": "Offer",
      // Tickets are sold on an external partner site; fall back to the event
      // page when no shop link is set yet.
      url: event.ticketUrl || eventUrl,
      price: event.isFree ? "0" : (event.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
