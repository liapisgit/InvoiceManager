-- Extend CompanyVatRegistry into the company catalog while preserving VAT lookup semantics.
ALTER TABLE public."CompanyVatRegistry"
ADD COLUMN "id" text;

UPDATE public."CompanyVatRegistry"
SET "id" = gen_random_uuid()::text
WHERE "id" IS NULL;

ALTER TABLE public."CompanyVatRegistry"
ALTER COLUMN "id" SET NOT NULL;

ALTER TABLE public."CompanyVatRegistry"
DROP CONSTRAINT "CompanyVatRegistry_pkey";

ALTER TABLE public."CompanyVatRegistry"
ADD CONSTRAINT "CompanyVatRegistry_pkey" PRIMARY KEY ("id");

ALTER TABLE public."CompanyVatRegistry"
ALTER COLUMN "vat_number" DROP NOT NULL;

CREATE UNIQUE INDEX "CompanyVatRegistry_vat_number_key"
ON public."CompanyVatRegistry" ("vat_number");

ALTER TABLE public."CompanyVatRegistry"
ADD COLUMN "company_display_name" text,
ADD COLUMN "is_self_project" boolean NOT NULL DEFAULT false,
ADD COLUMN "auto_self_approve" boolean NOT NULL DEFAULT false,
ADD COLUMN "is_active" boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "CompanyVatRegistry_company_display_name_key"
ON public."CompanyVatRegistry" ("company_display_name");

ALTER TABLE public."User"
ADD COLUMN "is_admin" boolean NOT NULL DEFAULT false;

CREATE TABLE public."Project" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "company_id" text NOT NULL,
  "name" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp(3) DEFAULT now(),
  "updated_at" timestamp(3) DEFAULT now(),
  CONSTRAINT "Project_company_id_fkey"
    FOREIGN KEY ("company_id")
    REFERENCES public."CompanyVatRegistry"("id")
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Project_company_id_name_key"
ON public."Project" ("company_id", "name");

-- Backfill display names and behavior flags for already-known owned companies.
UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'THE OLON DEVELOPMENTS',
    "is_self_project" = false,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '801792430';

UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'THE OLON HOSPITALITY',
    "is_self_project" = false,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '801227857';

UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'A15',
    "is_self_project" = true,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '802416678';

UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'OLYRAS',
    "is_self_project" = true,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '094116463';

UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'VOLUSPA',
    "is_self_project" = true,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '996611924';

UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'AIOLOU',
    "is_self_project" = true,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '802209794';

UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'LAGONISI VENTURES',
    "is_self_project" = true,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '802323148';

UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'HERITAGE',
    "is_self_project" = true,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '802376897';

UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'ALAMANAS ONE',
    "is_self_project" = true,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '802231518';

UPDATE public."CompanyVatRegistry"
SET "company_display_name" = 'HOT',
    "is_self_project" = true,
    "auto_self_approve" = false,
    "source" = 'manual',
    "updated_at" = now()
WHERE "vat_number" = '801558740';

-- Companies without known VAT numbers.
INSERT INTO public."CompanyVatRegistry"
  ("id", "vat_number", "company_name", "company_display_name", "is_self_project", "auto_self_approve", "source")
VALUES
  (gen_random_uuid()::text, NULL, 'QONTRALESS', 'QONTRALESS', true, false, 'manual'),
  (gen_random_uuid()::text, NULL, 'PERSONAL', 'PERSONAL', false, true, 'manual'),
  (gen_random_uuid()::text, NULL, 'ALPHA AXIS', 'ALPHA AXIS', true, false, 'manual'),
  (gen_random_uuid()::text, NULL, 'SEMELIDIS', 'SEMELIDIS', false, false, 'manual')
ON CONFLICT ("company_display_name") DO NOTHING;

-- Project/cost-center seed data for non-self-project companies.
INSERT INTO public."Project" ("id", "company_id", "name")
SELECT gen_random_uuid()::text, c."id", p."name"
FROM public."CompanyVatRegistry" c
JOIN (VALUES
  ('THE OLON HOSPITALITY', 'DIADOXOU 39 2BDR'),
  ('THE OLON HOSPITALITY', 'DIADOXOU 39 3BDR'),
  ('THE OLON HOSPITALITY', 'EKAVIS 4'),
  ('THE OLON HOSPITALITY', 'IASONOS 13'),
  ('THE OLON HOSPITALITY', 'METAXA 7 2BDR'),
  ('THE OLON HOSPITALITY', 'METAXA 7 3BDR'),
  ('THE OLON HOSPITALITY', 'METAXA 33 EXECUTIVE'),
  ('THE OLON HOSPITALITY', 'METAXA 33 SUPERIOR'),
  ('THE OLON HOSPITALITY', 'ATHINWN 46'),
  ('THE OLON HOSPITALITY', 'FRYNIXOU 11'),
  ('THE OLON HOSPITALITY', 'AIGEWS 6'),
  ('THE OLON HOSPITALITY', 'KAVOURIOU 1'),
  ('THE OLON HOSPITALITY', 'LITOUS 26'),
  ('THE OLON HOSPITALITY', 'NAYSIKAS 32'),
  ('THE OLON HOSPITALITY', 'METAXA 33-SUPERIOR'),
  ('THE OLON HOSPITALITY', 'SAKI KARAGIORGA 12-14'),
  ('THE OLON HOSPITALITY', 'ARTEMIDOS 5'),
  ('THE OLON HOSPITALITY', 'LAMBRAKI 6'),
  ('THE OLON HOSPITALITY', 'OFFICE'),
  ('THE OLON HOSPITALITY', 'STORAGE'),
  ('THE OLON HOSPITALITY', 'OPERATION'),
  ('THE OLON HOSPITALITY', 'MARKETING'),
  ('THE OLON HOSPITALITY', 'SEMELIDIS'),
  ('THE OLON DEVELOPMENTS', 'ALAMANAS, VOULA'),
  ('THE OLON DEVELOPMENTS', 'APOLLONOS, ATHENS'),
  ('THE OLON DEVELOPMENTS', 'IOUSTINIANOU, GLYFADA'),
  ('THE OLON DEVELOPMENTS', 'OT11 HERITAGE, VOULIAGMENI'),
  ('THE OLON DEVELOPMENTS', 'OT23 HERITAGE, VOULIAGMENI'),
  ('THE OLON DEVELOPMENTS', 'OT29 HERITAGE, VOULIAGMENI'),
  ('THE OLON DEVELOPMENTS', 'OT36 HERITAGE, VOULIAGMENI'),
  ('THE OLON DEVELOPMENTS', 'ARMONIAS, KAVOURI'),
  ('THE OLON DEVELOPMENTS', 'KIRKIS, VOULIAGMENI'),
  ('THE OLON DEVELOPMENTS', 'FLEMING, VARI'),
  ('THE OLON DEVELOPMENTS', 'XENOFONTOS, VOULA'),
  ('THE OLON DEVELOPMENTS', 'AIOLOU 85, ATHENS'),
  ('THE OLON DEVELOPMENTS', 'LAGONISI'),
  ('THE OLON DEVELOPMENTS', 'REAL ESTATE'),
  ('THE OLON DEVELOPMENTS', 'MARKETING'),
  ('THE OLON DEVELOPMENTS', 'OFFICE EXPENDABLES'),
  ('THE OLON DEVELOPMENTS', 'STORAGE'),
  ('THE OLON DEVELOPMENTS', 'CLIENT LEADS'),
  ('THE OLON DEVELOPMENTS', 'SEMELIDIS'),
  ('SEMELIDIS', 'FLEMING, VARI'),
  ('SEMELIDIS', 'XENOFONTOS, VOULA')
) AS p("company_display_name", "name")
ON c."company_display_name" = p."company_display_name"
ON CONFLICT ("company_id", "name") DO NOTHING;
