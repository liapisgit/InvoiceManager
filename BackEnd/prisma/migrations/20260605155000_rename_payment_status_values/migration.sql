UPDATE "Invoice"
SET "payment_status" = CASE
    WHEN "payment_status" = 'paid' THEN 'Paid'
    WHEN "payment_status" = 'to_be_paid' THEN 'To be Paid'
    WHEN "payment_status" = 'urgent' THEN 'Urgent'
    ELSE "payment_status"
END
WHERE "payment_status" IN ('paid', 'to_be_paid', 'urgent');
