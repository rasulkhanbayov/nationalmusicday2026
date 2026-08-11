-- Full event poster artwork, shown as its own section on the event page.
-- Separate from imageUrl (hero/card background) because the poster is a
-- portrait print asset meant to be viewed whole, not cropped as a backdrop.

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "posterUrl" TEXT;
