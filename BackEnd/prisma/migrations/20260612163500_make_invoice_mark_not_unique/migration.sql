-- Drop the unique index so multiple invoices can share the same mark.
DROP INDEX IF EXISTS "Invoice_mark_key";
