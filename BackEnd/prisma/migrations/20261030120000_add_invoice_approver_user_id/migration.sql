-- Allow at most one active user per phone, so a phone always resolves to a single approver.
-- Created first: if active users already share a phone, the migration fails before changing anything.
CREATE UNIQUE INDEX "User_phone_active_key"
ON "User" ("phone")
WHERE "is_active" = true AND "phone" IS NOT NULL AND "phone" <> '';

ALTER TABLE "Invoice" ADD COLUMN "approver_user_id" TEXT;

-- Self-approved invoices: the approver is the creator
UPDATE "Invoice"
SET "approver_user_id" = "createdBy"
WHERE "approver_id" = '0'
  AND "createdBy" IS NOT NULL;

-- Approver chosen by phone: match the user who has that phone now,
-- but only if exactly one user has it (skip ambiguous matches)
UPDATE "Invoice" AS i
SET "approver_user_id" = u."id"
FROM "User" AS u
WHERE i."approver_id" = u."phone"
  AND i."approver_id" <> '0'
  AND (SELECT COUNT(*) FROM "User" AS u2 WHERE u2."phone" = u."phone") = 1;

-- Fill approver_user_id from approver_id for every writer (backend, n8n, manual SQL),
-- using the user who is active with that phone at the time of writing.
CREATE OR REPLACE FUNCTION set_invoice_approver_user_id() RETURNS trigger AS $$
BEGIN
  -- approver_id changed without an explicit approver_user_id: resolve it again
  IF TG_OP = 'UPDATE'
     AND NEW."approver_id" IS DISTINCT FROM OLD."approver_id"
     AND NEW."approver_user_id" IS NOT DISTINCT FROM OLD."approver_user_id" THEN
    NEW."approver_user_id" := NULL;
  END IF;

  IF NEW."approver_user_id" IS NULL
     AND NEW."approver_id" IS NOT NULL AND NEW."approver_id" <> '' THEN
    IF NEW."approver_id" = '0' THEN
      NEW."approver_user_id" := NEW."createdBy";
    ELSE
      SELECT "id" INTO NEW."approver_user_id"
      FROM "User"
      WHERE "phone" = NEW."approver_id" AND "is_active" = true
      LIMIT 1;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_set_approver_user_id
BEFORE INSERT OR UPDATE OF "approver_id" ON "Invoice"
FOR EACH ROW EXECUTE FUNCTION set_invoice_approver_user_id();
