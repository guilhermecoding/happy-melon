-- AlterTable
ALTER TABLE "task_history" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'balloon_task',
ADD COLUMN     "printTaskId" TEXT;

-- CreateTable
CREATE TABLE "print_task" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" "BalloonDeliveryStatus" NOT NULL,
    "claimedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "print_task_contestId_idx" ON "print_task"("contestId");

-- CreateIndex
CREATE INDEX "print_task_teamId_createdAt_idx" ON "print_task"("teamId", "createdAt");

-- AddForeignKey
ALTER TABLE "print_task" ADD CONSTRAINT "print_task_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_task" ADD CONSTRAINT "print_task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_printTaskId_fkey" FOREIGN KEY ("printTaskId") REFERENCES "print_task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
