ALTER TABLE public."CompanyVatRegistry"
ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
