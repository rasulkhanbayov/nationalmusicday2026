import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/constants";
import { listPublicEvents } from "@/lib/events";

// Query events at request time, not during the static build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  // Only event detail pages — booking happens on our ticketing partner's site,
  // so there is no on-site seat/checkout route to index.
  const events = await listPublicEvents();
  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${base}/events/${e.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/events`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...eventEntries,
  ];
}
