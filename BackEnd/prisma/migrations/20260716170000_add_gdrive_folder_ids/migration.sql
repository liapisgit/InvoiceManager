ALTER TABLE public."CompanyVatRegistry"
ADD COLUMN "company_gdrive_folder_id" TEXT;

ALTER TABLE public."Project"
ADD COLUMN "project_gdrive_folder_id" TEXT;

ALTER TABLE public."User"
ADD COLUMN "user_gdrive_folder_id" TEXT;
