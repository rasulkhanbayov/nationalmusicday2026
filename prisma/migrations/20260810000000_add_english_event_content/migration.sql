-- English translations of the editorial event fields. The base columns hold the
-- primary language (German); these hold the English version and are used when
-- the visitor switches language. Nullable — an empty translation falls back to
-- the base field so a partially translated event still renders.

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "nameEn" TEXT,
ADD COLUMN     "subtitleEn" TEXT;
