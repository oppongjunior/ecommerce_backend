/*
  Warnings:

  - Added the required column `originalPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CartItem_productId_idx";

-- DropIndex
DROP INDEX "OrderItem_productId_idx";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "discountId" TEXT,
ADD COLUMN     "discountedPrice" DECIMAL(10,2),
ADD COLUMN     "originalPrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountTotal" DECIMAL(65,30),
ADD COLUMN     "totalWithOutDiscount" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "discountAmount" DECIMAL(10,2),
ADD COLUMN     "discountId" TEXT,
ADD COLUMN     "originalPrice" DECIMAL(10,2) NOT NULL;

-- CreateIndex
CREATE INDEX "CartItem_cartId_productId_idx" ON "CartItem"("cartId", "productId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_orderId_idx" ON "OrderItem"("productId", "orderId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
