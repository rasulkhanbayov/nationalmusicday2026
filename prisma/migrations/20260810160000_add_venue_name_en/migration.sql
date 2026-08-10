-- English venue name, so "Halle 1 & 2" can read "Hall 1 & 2" for English
-- visitors. Nullable: falls back to the primary venueName when unset.

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "venueNameEn" TEXT;
