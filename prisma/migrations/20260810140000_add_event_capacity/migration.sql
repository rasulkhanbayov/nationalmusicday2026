-- Explicit ticket capacity for general-admission events. Previously capacity
-- was implied by the seat grid (rows × seatsPerRow), which no longer applies
-- now that tickets are sold without seats. Null means unlimited.

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "capacity" INTEGER;
