import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
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

// GET /api/admin/export — attendees CSV (one row per ticket).
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.ticket.findMany({
    where: { order: { status: OrderStatus.PAID } },
    include: { order: true, seat: true },
  });

  tickets.sort((a, b) => compareSeatLabels(a.seat.label, b.seat.label));

  const headers = [
    "Order Number",
    "Ticket ID",
    "Seat",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Checked In",
    "Checked In At",
    "Purchased At",
  ];

  const rows = tickets.map((t) =>
    [
      t.order.orderNumber,
      t.ticketId,
      t.seat.label,
      t.order.firstName,
      t.order.lastName,
      t.order.email,
      t.order.phone ?? "",
      t.checkedIn ? "Yes" : "No",
      t.checkedInAt ? t.checkedInAt.toISOString() : "",
      t.order.paidAt ? t.order.paidAt.toISOString() : "",
    ]
      .map(csvCell)
      .join(","),
  );

  // Prepend BOM so Excel reads UTF-8 correctly.
  const csv = "﻿" + [headers.map(csvCell).join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendees-national-music-day-2026.csv"`,
    },
  });
}
