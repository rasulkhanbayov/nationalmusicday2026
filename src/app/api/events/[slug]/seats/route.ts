import { NextRequest, NextResponse } from "next/server";
import { getSeatMap } from "@/lib/seats";
import { getEventBySlug, rowLetters } from "@/lib/events";

export const dynamic = "force-dynamic";

// GET /api/events/[slug]/seats — public seat map + event pricing for one event.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const seats = await getSeatMap(event.id);

  return NextResponse.json({
    eventId: event.id,
    slug: event.slug,
    isFree: event.isFree,
    priceCents: event.priceCents,
    seats,
    rows: rowLetters(event.rows),
    seatsPerRow: event.seatsPerRow,
  });
}
