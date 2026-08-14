-- CreateIndex
CREATE INDEX "balloon_delivery_contestId_claimedByUserId_status_idx" ON "balloon_delivery"("contestId", "claimedByUserId", "status");

-- CreateIndex
CREATE INDEX "print_task_contestId_claimedByUserId_status_idx" ON "print_task"("contestId", "claimedByUserId", "status");
