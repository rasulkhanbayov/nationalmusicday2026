-- Tickets are sold on an external ticketing partner's site, so each Event
-- carries the outbound shop link its "Buy Tickets" button points at.
-- Nullable: an event may be published before sales open, in which case the
-- public page shows "Tickets coming soon" instead of a dead link.

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "ticketUrl" TEXT;
