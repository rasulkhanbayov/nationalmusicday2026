import { prisma } from "./prisma";
import { OrderStatus } from "@prisma/client";

export type ValidationResult =
  | {
      status: "VALID";
      ticketId: string;
      seatLabel: string | null;
      tierName: string | null;
      orderNumber: string;
      purchaserName: string;
      eventName: string;
    }
  | {
      status: "ALREADY_USED";
      ticketId: string;
      seatLabel: string | null;
      tierName: string | null;
      orderNumber: string;
      purchaserName: string;
      eventName: string;
      checkedInAt: string;
    }
  | {
      // Valid ticket, but for a different event than the one being scanned.
      status: "WRONG_EVENT";
      ticketId: string;
      seatLabel: string | null;
      tierName: string | null;
      orderNumber: string;
      purchaserName: string;
      eventName: string;
    }
  | { status: "INVALID"; ticketId: string };

/**
 * Validates a scanned ticket id and, if valid, marks it checked in.
 *
 * @param expectedEventId  if provided, a ticket for a *different* event is
 *   reported as WRONG_EVENT (and not checked in).
 */
export async function validateTicket(
  rawTicketId: string,
  checkIn = true,
  expectedEventId?: string | null,
): Promise<ValidationResult> {
  const ticketId = rawTicketId.trim();

  const ticket = await prisma.ticket.findUnique({
    where: { ticketId },
    include: { order: true, seat: true, event: true },
  });

  // Unknown ticket, or belongs to a non-paid/unconfirmed order → invalid.
  if (!ticket || ticket.order.status !== OrderStatus.PAID) {
    return { status: "INVALID", ticketId };
  }

  const purchaserName =
    `${ticket.order.firstName} ${ticket.order.lastName}`.trim();
  const base = {
    ticketId,
    seatLabel: ticket.seat?.label ?? null,
    tierName: ticket.tierName ?? null,
    orderNumber: ticket.order.orderNumber,
    purchaserName,
    eventName: ticket.event.name,
  };

  if (expectedEventId && ticket.eventId !== expectedEventId) {
    return { status: "WRONG_EVENT", ...base };
  }

  if (ticket.checkedIn) {
    return {
      status: "ALREADY_USED",
      ...base,
      checkedInAt: ticket.checkedInAt?.toISOString() ?? "",
    };
  }

  if (checkIn) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { checkedIn: true, checkedInAt: new Date() },
    });
  }

  return { status: "VALID", ...base };
}
