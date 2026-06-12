import type { MetadataRoute } from "next";
import { EVENT } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${EVENT.name} — ${EVENT.subtitle}`,
    short_name: "NMD 2026",
    description: EVENT.subtitle,
    start_url: "/",
    display: "standalone",
    background_color: "#0a1733",
    theme_color: "#0a1733",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
