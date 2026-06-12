import { prisma } from "./prisma";
import { OrderStatus } from "@prisma/client";

export type ValidationResult =
  | {
      status: "VALID";
      ticketId: string;
      seatLabel: string;
      orderNumber: string;
      purchaserName: string;
    }
  | {
      status: "ALREADY_USED";
      ticketId: string;
      seatLabel: string;
      orderNumber: string;
      purchaserName: string;
      checkedInAt: string;
    }
  | { status: "INVALID"; ticketId: string };

/**
 * Validates a scanned ticket id and, if valid, marks it checked in.
 * Returns one of: VALID (just checked in), ALREADY_USED, or INVALID.
 *
 * Pass `checkIn: false` to only inspect a ticket without checking it in.
 */
export async function validateTicket(
  rawTicketId: string,
  checkIn = true,
): Promise<ValidationResult> {
  const ticketId = rawTicketId.trim();

  const ticket = await prisma.ticket.findUnique({
    where: { ticketId },
    include: { order: true, seat: true },
  });

  // Unknown ticket, or belongs to a non-paid order → invalid.
  if (!ticket || ticket.order.status !== OrderStatus.PAID) {
    return { status: "INVALID", ticketId };
  }

  const purchaserName =
    `${ticket.order.firstName} ${ticket.order.lastName}`.trim();

  if (ticket.checkedIn) {
    return {
      status: "ALREADY_USED",
      ticketId,
      seatLabel: ticket.seat.label,
      orderNumber: ticket.order.orderNumber,
      purchaserName,
      checkedInAt: ticket.checkedInAt?.toISOString() ?? "",
    };
  }

  if (checkIn) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { checkedIn: true, checkedInAt: new Date() },
    });
  }

  return {
    status: "VALID",
    ticketId,
    seatLabel: ticket.seat.label,
    orderNumber: ticket.order.orderNumber,
    purchaserName,
  };
}
