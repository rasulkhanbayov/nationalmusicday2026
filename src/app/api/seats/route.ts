import { NextResponse } from "next/server";
import { getSeatMap } from "@/lib/seats";
import { getTicketPriceCents } from "@/lib/config";
import { HALL } from "@/lib/constants";

export const dynamic = "force-dynamic";

// GET /api/seats — public seat map + current price.
export async function GET() {
  const [seats, priceCents] = await Promise.all([
    getSeatMap(),
    getTicketPriceCents(),
  ]);

  return NextResponse.json({
    seats,
    priceCents,
    rows: HALL.rows,
    seatsPerRow: HALL.seatsPerRow,
  });
}
