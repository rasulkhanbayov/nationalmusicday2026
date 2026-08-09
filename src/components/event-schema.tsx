import { SITE, siteUrl } from "@/lib/constants";
import type { EventView } from "@/lib/events";

/** Injects schema.org MusicEvent structured data for one event. */
export function EventSchema({ event }: { event: EventView }) {
  const url = siteUrl();
  const eventUrl = `${url}/events/${event.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: event.name,
    description: event.subtitle || event.description || event.name,
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
      url: `${eventUrl}/seats`,
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
