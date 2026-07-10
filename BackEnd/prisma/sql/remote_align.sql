-- Align the existing olon_automations_v2 schema with the InvoiceManager app.
-- This script changes schema only and does not copy data from invoice_manager_feature.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE olon_automations_v2.users
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS password text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE olon_automations_v2.users
SET
  id = COALESCE(id, gen_random_uuid()),
  user_name = COALESCE(NULLIF(user_name, ''), phone_id),
  password = COALESCE(password, '')
WHERE id IS NULL
   OR user_name IS NULL
   OR user_name = ''
   OR password IS NULL;

ALTER TABLE olon_automations_v2.users
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN user_name SET NOT NULL,
  ALTER COLUMN password SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_id_key
  ON olon_automations_v2.users (id);

CREATE UNIQUE INDEX IF NOT EXISTS users_user_name_key
  ON olon_automations_v2.users (user_name);

ALTER TABLE olon_automations_v2.companies
  ADD COLUMN IF NOT EXISTS is_issuer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_self_project boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_self_approve boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS companies_invm_company_display_name_key
  ON olon_automations_v2.companies (invm_company_display_name)
  WHERE invm_company_display_name IS NOT NULL;

ALTER TABLE olon_automations_v2.invm_projects
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS invm_projects_company_id_project_name_key
  ON olon_automations_v2.invm_projects (company_id, project_name);

ALTER TABLE olon_automations_v2.invm_invoice_sessions
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

UPDATE olon_automations_v2.invm_invoice_sessions
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

ALTER TABLE olon_automations_v2.invm_invoice_sessions
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'complete',
  ALTER COLUMN parsing_status SET DEFAULT 'pending';
