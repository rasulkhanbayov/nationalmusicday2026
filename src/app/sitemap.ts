import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/seats`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];
}
