-- DropForeignKey
ALTER TABLE "Transfer" DROP CONSTRAINT "Transfer_toShopId_fkey";

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "fromShopId" TEXT,
ADD COLUMN     "fromWarehouseId" TEXT,
ADD COLUMN     "toWarehouseId" TEXT,
ALTER COLUMN "toShopId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromShopId_fkey" FOREIGN KEY ("fromShopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toShopId_fkey" FOREIGN KEY ("toShopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
