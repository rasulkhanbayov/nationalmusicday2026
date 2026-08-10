import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventDetail } from "@/components/event-detail";
import { EventSchema } from "@/components/event-schema";
import { getEventBySlug, getAvailability } from "@/lib/events";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/i18n";

/** The visitor's saved language, for locale-aware metadata / structured data. */
async function currentLocale() {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(saved) ? saved : DEFAULT_LOCALE;
}

/** Picks the English variant when reading English and one exists. */
function pick(locale: string, base: string | null, en: string | null): string {
  return (locale === "en" ? en?.trim() || base : base) ?? "";
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };

  const locale = await currentLocale();
  const name = pick(locale, event.name, event.nameEn);
  const description =
    pick(locale, event.subtitle, event.subtitleEn) ||
    `${name} at ${event.venue.name}, ${event.venue.city} on ${event.dateLong}.`;

  return {
    title: name,
    description,
    openGraph: { title: name, description, type: "website" },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || event.status === "DRAFT") notFound();

  const { available } = await getAvailability(event.id);
  const locale = await currentLocale();

  return (
    <>
      <EventSchema event={event} locale={locale} />
      <SiteHeader />
      <main>
        <EventDetail event={event} available={available} />
      </main>
      <SiteFooter />
    </>
  );
}
