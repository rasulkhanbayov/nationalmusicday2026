import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventDetail } from "@/components/event-detail";
import { EventSchema } from "@/components/event-schema";
import { getEventBySlug, getAvailability } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };
  const description =
    event.subtitle ||
    `${event.name} at ${event.venue.name}, ${event.venue.city} on ${event.dateLong}.`;
  return {
    title: event.name,
    description,
    openGraph: { title: event.name, description, type: "website" },
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

  return (
    <>
      <EventSchema event={event} />
      <SiteHeader />
      <main>
        <EventDetail event={event} available={available} />
      </main>
      <SiteFooter />
    </>
  );
}
