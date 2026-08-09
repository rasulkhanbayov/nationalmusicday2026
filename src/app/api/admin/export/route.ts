import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { compareSeatLabels } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Escapes a value for CSV (handles commas, quotes, newlines).
function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// GET /api/admin/export[?eventId=...] — attendees CSV (one row per ticket).
// Optionally scoped to one event.
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eventId = req.nextUrl.searchParams.get("eventId");
  const where: Prisma.TicketWhereInput = {
    order: { status: OrderStatus.PAID },
    ...(eventId ? { eventId } : {}),
  };

  const tickets = await prisma.ticket.findMany({
    where,
    include: { order: true, seat: true, event: true },
  });

  tickets.sort((a, b) => {
    if (a.event.name !== b.event.name)
      return a.event.name.localeCompare(b.event.name);
    return compareSeatLabels(a.seat.label, b.seat.label);
  });

  const headers = [
    "Event",
    "Order Number",
    "Ticket ID",
    "Seat",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Admission",
    "Checked In",
    "Checked In At",
    "Confirmed At",
  ];

  const rows = tickets.map((t) =>
    [
      t.event.name,
      t.order.orderNumber,
      t.ticketId,
      t.seat.label,
      t.order.firstName,
      t.order.lastName,
      t.order.email,
      t.order.phone ?? "",
      t.order.isFree ? "Free" : (t.order.totalCents / 100).toFixed(2),
      t.checkedIn ? "Yes" : "No",
      t.checkedInAt ? t.checkedInAt.toISOString() : "",
      t.order.paidAt ? t.order.paidAt.toISOString() : "",
    ]
      .map(csvCell)
      .join(","),
  );

  // Prepend BOM so Excel reads UTF-8 correctly.
  const csv = "﻿" + [headers.map(csvCell).join(","), ...rows].join("\r\n");
  const suffix = eventId ? `-${eventId.slice(0, 8)}` : "-all";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendees${suffix}.csv"`,
    },
  });
}
