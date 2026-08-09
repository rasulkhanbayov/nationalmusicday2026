import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SITE, siteUrl } from "@/lib/constants";

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
const title = `${SITE.name} — ${SITE.tagline}`;
const description = `${SITE.tagline}. Browse upcoming concerts and recitals and reserve your seats online.`;

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: title,
    template: `%s · ${SITE.name}`,
  },
  description,
  keywords: [
    "Commontone",
    "cultural concerts Germany",
    "classical concert Munich",
    "concert tickets Germany",
    "Azerbaijani music",
  ],
  authors: [{ name: SITE.organizer }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url,
    siteName: SITE.name,
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
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
