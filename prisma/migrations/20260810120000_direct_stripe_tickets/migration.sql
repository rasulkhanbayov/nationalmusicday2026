-- Direct Stripe checkout without seat selection.
--
-- Tickets are now general admission, bought by ticket type (Standard/Support)
-- rather than by seat, so Ticket.seatId becomes optional and each ticket
-- records which tier it is and what was paid for it. Order.itemsJson holds the
-- per-tier breakdown. Event gains the admission notice (DE/EN).
--
-- All changes are additive or relaxing; existing seated tickets keep their seat.

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_seatId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "notice" TEXT,
ADD COLUMN     "noticeEn" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "itemsJson" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "priceCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tierName" TEXT,
ALTER COLUMN "seatId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

