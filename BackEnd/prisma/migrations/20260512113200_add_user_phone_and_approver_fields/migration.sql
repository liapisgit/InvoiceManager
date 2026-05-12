-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "is_approver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approver_number" TEXT;
