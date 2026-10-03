-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "telegramError" TEXT,
ADD COLUMN     "telegramFailedAt" TIMESTAMP(3),
ADD COLUMN     "telegramLastSentAt" TIMESTAMP(3);
