import { prisma } from "./prisma";
import { Prisma, SeatStatus } from "@prisma/client";
import { RESERVATION_MINUTES, MAX_SEATS_PER_ORDER } from "./constants";
import { compareSeatLabels } from "./utils";

export type SeatView = {
  label: string;
  row: string;
  number: number;
  // Status as the public client should see it. RESERVED holds that have
  // expired are reported as AVAILABLE.
  status: "AVAILABLE" | "RESERVED" | "SOLD";
};

/**
 * Returns the public seat map for one event. Expired reservations are surfaced
 * as AVAILABLE so the client doesn't block seats that are effectively free.
 */
export async function getSeatMap(eventId: string): Promise<SeatView[]> {
  const now = new Date();
  const seats = await prisma.seat.findMany({
    where: { eventId },
    orderBy: [{ row: "asc" }, { number: "asc" }],
  });

  return seats
    .map((s) => {
      let status: SeatView["status"] = s.status as SeatView["status"];
      if (
        s.status === SeatStatus.RESERVED &&
        (!s.reservedUntil || s.reservedUntil < now)
      ) {
        status = "AVAILABLE";
      }
      return { label: s.label, row: s.row, number: s.number, status };
    })
    .sort((a, b) => compareSeatLabels(a.label, b.label));
}

export class SeatUnavailableError extends Error {
  constructor(public readonly unavailable: string[]) {
    super(`Seats unavailable: ${unavailable.join(", ")}`);
    this.name = "SeatUnavailableError";
  }
}

/**
 * Atomically reserves the requested seats (within one event) for an order.
 * Throws SeatUnavailableError if any requested seat is sold or actively held
 * by a different order. Runs in a serializable transaction to prevent two
 * buyers grabbing the same seat concurrently.
 */
export async function reserveSeats(
  eventId: string,
  seatLabels: string[],
  orderId: string,
): Promise<void> {
  if (seatLabels.length === 0) {
    throw new Error("No seats selected.");
  }
  if (seatLabels.length > MAX_SEATS_PER_ORDER) {
    throw new Error(`You can select at most ${MAX_SEATS_PER_ORDER} seats.`);
  }

  const reservedUntil = new Date(Date.now() + RESERVATION_MINUTES * 60_000);
  const now = new Date();

  await prisma.$transaction(
    async (tx) => {
      const seats = await tx.seat.findMany({
        where: { eventId, label: { in: seatLabels } },
      });

      if (seats.length !== seatLabels.length) {
        const found = new Set(seats.map((s) => s.label));
        const missing = seatLabels.filter((l) => !found.has(l));
        throw new SeatUnavailableError(missing);
      }

      const unavailable = seats.filter((s) => {
        if (s.status === SeatStatus.SOLD) return true;
        if (s.status === SeatStatus.RESERVED) {
          const heldByOther = s.orderId && s.orderId !== orderId;
          const stillValid = s.reservedUntil && s.reservedUntil > now;
          return Boolean(heldByOther && stillValid);
        }
        return false;
      });

      if (unavailable.length > 0) {
        throw new SeatUnavailableError(unavailable.map((s) => s.label));
      }

      await tx.seat.updateMany({
        where: { eventId, label: { in: seatLabels } },
        data: {
          status: SeatStatus.RESERVED,
          reservedUntil,
          orderId,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/** Releases any seats currently held by an order back to AVAILABLE. */
export async function releaseSeatsForOrder(orderId: string): Promise<void> {
  await prisma.seat.updateMany({
    where: { orderId, status: SeatStatus.RESERVED },
    data: { status: SeatStatus.AVAILABLE, reservedUntil: null, orderId: null },
  });
}
