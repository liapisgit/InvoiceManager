UPDATE "Invoice"
SET "approver_id" = "User"."phone"
FROM "User"
WHERE "Invoice"."approver_id" = "User"."id"
  AND "User"."phone" IS NOT NULL
  AND "User"."phone" <> '';
