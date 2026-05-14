-- CreateEnum
CREATE TYPE "InvoiceOrigin" AS ENUM ('app', 'email', 'whatsapp');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "origin" "InvoiceOrigin" NOT NULL DEFAULT 'app';
