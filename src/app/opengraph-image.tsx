import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamically generated Open Graph / Twitter card image.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, #102047 0%, #0a1733 55%, #060d20 100%)",
          color: "white",
          fontFamily: "serif",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#c9a14a",
            marginBottom: 24,
          }}
        >
          {SITE.tagline}
        </div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>
          Common<span style={{ color: "#c9a14a" }}>tone</span>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 24,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          Concerts & Recitals · Munich, Germany
        </div>
      </div>
    ),
    { ...size },
  );
}
