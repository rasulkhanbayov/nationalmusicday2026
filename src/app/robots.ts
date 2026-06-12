import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/success"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
