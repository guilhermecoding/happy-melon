-- AlterTable
ALTER TABLE "system-auth"."session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "system-auth"."user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
ADD COLUMN     "role" TEXT;
