-- AlterTable
ALTER TABLE "competition" ADD COLUMN "multiTouchBanEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "multiTouchBanSeconds" INTEGER;

-- CreateTable
CREATE TABLE "staff_multi_touch_ban" (
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_multi_touch_ban_pkey" PRIMARY KEY ("competitionId","userId")
);

-- AddForeignKey
ALTER TABLE "staff_multi_touch_ban" ADD CONSTRAINT "staff_multi_touch_ban_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
