/*
  Warnings:

  - You are about to drop the `Wishlist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProductToWishlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_userId_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToWishlist" DROP CONSTRAINT "_ProductToWishlist_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToWishlist" DROP CONSTRAINT "_ProductToWishlist_B_fkey";

-- DropTable
DROP TABLE "Wishlist";

-- DropTable
DROP TABLE "_ProductToWishlist";

-- CreateTable
CREATE TABLE "WishList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductToWishList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToWishList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "WishList_userId_key" ON "WishList"("userId");

-- CreateIndex
CREATE INDEX "_ProductToWishList_B_index" ON "_ProductToWishList"("B");

-- AddForeignKey
ALTER TABLE "WishList" ADD CONSTRAINT "WishList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToWishList" ADD CONSTRAINT "_ProductToWishList_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToWishList" ADD CONSTRAINT "_ProductToWishList_B_fkey" FOREIGN KEY ("B") REFERENCES "WishList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
