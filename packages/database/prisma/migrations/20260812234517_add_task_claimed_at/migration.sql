-- AlterTable
ALTER TABLE "balloon_delivery" ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "print_task" ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "balloon_delivery_status_claimedAt_idx" ON "balloon_delivery"("status", "claimedAt");

-- CreateIndex
CREATE INDEX "print_task_status_claimedAt_idx" ON "print_task"("status", "claimedAt");
