-- AlterTable
ALTER TABLE "task_history" ADD COLUMN "relatedTaskId" TEXT;

-- Backfill denormalized relatedTaskId for existing rows
UPDATE "task_history"
SET "relatedTaskId" = COALESCE("printTaskId", "balloonDeliveryId")
WHERE "relatedTaskId" IS NULL
  AND ("printTaskId" IS NOT NULL OR "balloonDeliveryId" IS NOT NULL);

-- CreateIndex
CREATE INDEX "task_history_contestId_relatedTaskId_createdAt_idx" ON "task_history"("contestId", "relatedTaskId", "createdAt");

-- CreateIndex
CREATE INDEX "task_history_balloonDeliveryId_createdAt_idx" ON "task_history"("balloonDeliveryId", "createdAt");

-- CreateIndex
CREATE INDEX "task_history_printTaskId_createdAt_idx" ON "task_history"("printTaskId", "createdAt");
