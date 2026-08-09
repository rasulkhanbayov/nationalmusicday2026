-- Hero/card artwork for an event, and optional ticket tiers for events that
-- sell more than one ticket type (e.g. Standard / Support). Both nullable so
-- existing events are unaffected.

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "tiersJson" TEXT;
