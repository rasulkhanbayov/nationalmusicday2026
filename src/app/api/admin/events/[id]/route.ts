import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/schemas";
import { EventStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/admin/events/[id] — single event (admin).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ event });
}

// Adds any missing seats when an event's layout is enlarged. Shrinking the
// layout is intentionally not destructive — existing seats are kept.
async function syncSeatsOnGrow(
  eventId: string,
  rows: number,
  seatsPerRow: number,
) {
  const letters = Array.from({ length: rows }, (_, i) =>
    String.fromCharCode(65 + i),
  );
  const data = [];
  for (const row of letters) {
    for (let n = 1; n <= seatsPerRow; n++) {
      data.push({ eventId, label: `${row}${n}`, row, number: n });
    }
  }
  await prisma.seat.createMany({ data, skipDuplicates: true });
}

// PUT /api/admin/events/[id] — update an event.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let input;
  try {
    input = eventSchema.parse(await req.json());
  } catch (err) {
    const message =
      err && typeof err === "object" && "errors" in err
        ? (err as { errors: { message: string }[] }).errors
            ?.map((e) => e.message)
            .join(", ")
        : "Invalid event data";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        slug: input.slug,
        status: input.status as EventStatus,
        name: input.name,
        subtitle: input.subtitle || null,
        type: input.type || "Concert",
        description: input.description || null,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        doorsTime: input.doorsTime || null,
        venueName: input.venueName,
        venueStreet: input.venueStreet,
        venuePostalCode: input.venuePostalCode,
        venueCity: input.venueCity,
        venueCountry: input.venueCountry || "Germany",
        ticketUrl: input.ticketUrl || null,
        imageUrl: input.imageUrl || null,
        isFree: input.isFree,
        priceCents: input.isFree ? 0 : Math.round(input.priceEuros * 100),
        rows: input.rows,
        seatsPerRow: input.seatsPerRow,
        orderPrefix: input.orderPrefix.toUpperCase(),
        contactEmail: input.contactEmail || null,
      },
    });

    await syncSeatsOnGrow(event.id, event.rows, event.seatsPerRow);
    return NextResponse.json({ id: event.id, slug: event.slug });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An event with that slug already exists." },
        { status: 409 },
      );
    }
    console.error("[admin/events] update failed:", err);
    return NextResponse.json({ error: "Could not update event" }, { status: 500 });
  }
}
