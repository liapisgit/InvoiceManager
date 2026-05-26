-- Alter the invoice origin column to plain text.
ALTER TABLE "Invoice" ALTER COLUMN "origin" DROP DEFAULT;

ALTER TABLE "Invoice"
ALTER COLUMN "origin" TYPE TEXT
USING "origin"::TEXT;

DROP TYPE "InvoiceOrigin";

ALTER TABLE "Invoice" ALTER COLUMN "origin" SET DEFAULT 'app';
