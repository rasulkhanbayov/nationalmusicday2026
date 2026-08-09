import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/schemas";
import { EventStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Builds the Prisma create/update payload from validated form input.
function toData(input: import("@/lib/schemas").EventInput) {
  return {
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
  };
}

// Creates the rows × seatsPerRow seats for a new event.
async function createSeats(eventId: string, rows: number, seatsPerRow: number) {
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

// GET /api/admin/events — list all events (admin).
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });
  return NextResponse.json({ events });
}

// POST /api/admin/events — create a new event (+ its seats).
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
    const event = await prisma.event.create({ data: toData(input) });
    await createSeats(event.id, event.rows, event.seatsPerRow);
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
    console.error("[admin/events] create failed:", err);
    return NextResponse.json({ error: "Could not create event" }, { status: 500 });
  }
}
