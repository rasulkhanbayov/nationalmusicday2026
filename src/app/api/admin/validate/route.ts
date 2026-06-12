import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { validateSchema } from "@/lib/schemas";
import { validateTicket } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/admin/validate — scan a ticket id, check it in if valid.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = validateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await validateTicket(parsed.ticketId, parsed.checkIn);
  return NextResponse.json(result);
}
