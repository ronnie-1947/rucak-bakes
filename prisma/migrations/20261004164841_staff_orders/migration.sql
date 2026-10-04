-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('ONLINE', 'STAFF');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "menuPricePaise" INTEGER;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'ONLINE';

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A staff order names who entered it (7R.5); an online order may not.
ALTER TABLE "orders" ADD CONSTRAINT o_staff_has_creator CHECK ("source" <> 'STAFF' OR "createdById" IS NOT NULL);

-- Staff may set a line's price, so the line's own arithmetic is now worth guarding.
ALTER TABLE "order_items" ADD CONSTRAINT oi_price_nonnegative CHECK ("unitPricePaise" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT oi_line_adds_up CHECK ("lineTotalPaise" = "unitPricePaise" * "quantity");
