import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { EventForm, type EventFormValues } from "@/components/admin/event-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Event",
  robots: { index: false, follow: false },
};

// Formats a Date into the "YYYY-MM-DDTHH:mm" string a datetime-local input wants,
// in Europe/Berlin so the admin edits wall-clock time.
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Berlin",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await prisma.event.findUnique({ where: { id } });
  if (!e) notFound();

  const initial: EventFormValues = {
    slug: e.slug,
    status: e.status,
    name: e.name,
    nameEn: e.nameEn ?? "",
    subtitle: e.subtitle ?? "",
    subtitleEn: e.subtitleEn ?? "",
    type: e.type,
    description: e.description ?? "",
    descriptionEn: e.descriptionEn ?? "",
    notice: e.notice ?? "",
    noticeEn: e.noticeEn ?? "",
    startsAt: toLocalInput(e.startsAt),
    endsAt: toLocalInput(e.endsAt),
    doorsTime: e.doorsTime ?? "",
    venueName: e.venueName,
    venueStreet: e.venueStreet,
    venuePostalCode: e.venuePostalCode,
    venueCity: e.venueCity,
    venueCountry: e.venueCountry,
    ticketUrl: e.ticketUrl ?? "",
    imageUrl: e.imageUrl ?? "",
    posterUrl: e.posterUrl ?? "",
    isFree: e.isFree,
    priceEuros: (e.priceCents / 100).toString(),
    capacity: e.capacity ? e.capacity.toString() : "",
    rows: e.rows.toString(),
    seatsPerRow: e.seatsPerRow.toString(),
    orderPrefix: e.orderPrefix,
    contactEmail: e.contactEmail ?? "",
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy-900">
          Edit Event
        </h1>
        <p className="text-muted-foreground">{e.name}</p>
      </div>
      <EventForm mode="edit" eventId={e.id} initial={initial} />
    </AdminShell>
  );
}
