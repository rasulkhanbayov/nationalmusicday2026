import { EVENT, siteUrl } from "@/lib/constants";

/**
 * Injects schema.org MusicEvent structured data for rich search results.
 * `priceEuros` is the current ticket price.
 */
export function EventSchema({ priceEuros }: { priceEuros: number }) {
  const url = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: EVENT.name,
    description: EVENT.subtitle,
    startDate: EVENT.startTimeISO,
    endDate: EVENT.endTimeISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: [`${url}/og-image.png`],
    location: {
      "@type": "Place",
      name: EVENT.venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: EVENT.venue.street,
        postalCode: EVENT.venue.postalCode,
        addressLocality: EVENT.venue.city,
        addressCountry: EVENT.venue.countryCode,
      },
    },
    organizer: {
      "@type": "Organization",
      name: EVENT.organizer,
      url,
    },
    offers: {
      "@type": "Offer",
      url: `${url}/seats`,
      price: priceEuros.toFixed(2),
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
