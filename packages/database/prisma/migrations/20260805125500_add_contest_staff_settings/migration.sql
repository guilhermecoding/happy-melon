-- AlterTable
ALTER TABLE "contest" ADD COLUMN     "balloonLimitEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "balloonLimit" INTEGER,
ADD COLUMN     "deliveryTimeoutEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryTimeoutMinutes" INTEGER;
