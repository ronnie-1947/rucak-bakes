-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "weightGrams" INTEGER;

-- A by-weight line's size — the order pipeline takes 500 g steps up to 5 kg.
ALTER TABLE "order_items" ADD CONSTRAINT oi_weight_positive CHECK ("weightGrams" IS NULL OR "weightGrams" > 0);
