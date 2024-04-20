-- DropForeignKey
ALTER TABLE "Seat" DROP CONSTRAINT "Seat_bookingId_fkey";

-- AlterTable
ALTER TABLE "Seat" ALTER COLUMN "bookingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
