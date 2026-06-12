import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { priceUpdateSchema } from "@/lib/schemas";
import { getTicketPriceCents, setTicketPriceCents } from "@/lib/config";

export const dynamic = "force-dynamic";

// GET /api/admin/price — current price.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cents = await getTicketPriceCents();
  return NextResponse.json({ cents, euros: cents / 100 });
}

// PUT /api/admin/price  { euros: number }
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let parsed;
  try {
    parsed = priceUpdateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  const cents = Math.round(parsed.euros * 100);
  await setTicketPriceCents(cents);
  return NextResponse.json({ cents, euros: cents / 100 });
}
