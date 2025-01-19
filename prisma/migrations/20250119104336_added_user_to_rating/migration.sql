/*
  Warnings:

  - Added the required column `userId` to the `Rating` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Subcategory" ADD COLUMN     "image" TEXT;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
