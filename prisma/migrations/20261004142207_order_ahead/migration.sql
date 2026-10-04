-- AlterTable
ALTER TABLE "menu_day_items" ADD COLUMN     "soldOutAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "bakeSeparately" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noticeDays" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "orderable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "bakedAt" TIMESTAMP(3);


-- Notice: 0 (the day's own cutoff) to 30 days. The form caps it at the booking window (7).
ALTER TABLE "menu_items" ADD CONSTRAINT mi_notice_days_range CHECK ("noticeDays" BETWEEN 0 AND 30);

-- Orders no longer draw down a day's items (7R): a day's items are its counter-items, and
-- quantityOrdered stops moving. Pre-launch, so every count is reset rather than carried.
UPDATE "menu_day_items" SET "quantityOrdered" = 0;
