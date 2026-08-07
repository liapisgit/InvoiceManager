-- Allow CompanyVatRegistry.id updates to cascade to Project.company_id.
ALTER TABLE public."Project"
DROP CONSTRAINT "Project_company_id_fkey";

ALTER TABLE public."Project"
ADD CONSTRAINT "Project_company_id_fkey"
FOREIGN KEY ("company_id")
REFERENCES public."CompanyVatRegistry"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
