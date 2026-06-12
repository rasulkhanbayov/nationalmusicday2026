import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { EVENT, siteUrl } from "@/lib/constants";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const url = siteUrl();
const description = `${EVENT.subtitle}. A classical music concert on ${EVENT.dateLong} at ${EVENT.venue.name}, ${EVENT.venue.city}. Reserve your seat — only ${EVENT.capacity} available.`;

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: `${EVENT.name} — ${EVENT.subtitle}`,
    template: `%s · ${EVENT.name}`,
  },
  description,
  keywords: [
    "Azerbaijani music",
    "National Music Day",
    "classical concert Munich",
    "Einstein Kultur",
    "Azerbaijan culture Germany",
  ],
  authors: [{ name: EVENT.organizer }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url,
    siteName: EVENT.name,
    title: `${EVENT.name} — ${EVENT.subtitle}`,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: EVENT.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${EVENT.name} — ${EVENT.subtitle}`,
    description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
