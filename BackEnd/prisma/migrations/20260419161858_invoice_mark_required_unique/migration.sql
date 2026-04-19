/*
  Warnings:

  - A unique constraint covering the columns `[mark]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Made the column `mark` on table `Invoice` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "mark" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_mark_key" ON "Invoice"("mark");
