-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "imageAlts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sizeNote" TEXT,
ADD COLUMN     "storageNote" TEXT;

