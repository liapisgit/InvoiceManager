ALTER TABLE "Invoice" RENAME COLUMN "is_paid" TO "payment_status";

ALTER TABLE "Invoice"
ALTER COLUMN "payment_status" TYPE TEXT
USING CASE
    WHEN "payment_status" IS TRUE THEN 'paid'
    WHEN "payment_status" IS FALSE THEN 'to_be_paid'
    ELSE NULL
END;
