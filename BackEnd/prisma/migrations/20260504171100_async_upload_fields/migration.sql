-- Allow async upload rows to exist before parsing discovers the invoice mark.
ALTER TABLE "Invoice" ALTER COLUMN "mark" DROP NOT NULL;

-- Store the local Multer path separately from the Google Drive URL.
ALTER TABLE "Invoice" ADD COLUMN "file_path" TEXT;

-- Track parser/review lifecycle and user approval state.
ALTER TABLE "Invoice" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'complete';
ALTER TABLE "Invoice" ADD COLUMN "approval_status" TEXT;
