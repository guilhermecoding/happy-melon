-- CreateEnum
CREATE TYPE "BalloonDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'WITHHELD');

-- CreateTable
CREATE TABLE "balloon_delivery" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "status" "BalloonDeliveryStatus" NOT NULL,
    "claimedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balloon_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_history" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "BalloonDeliveryStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "teamId" TEXT,
    "questionId" TEXT,
    "balloonDeliveryId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "balloon_delivery_contestId_idx" ON "balloon_delivery"("contestId");

-- CreateIndex
CREATE INDEX "balloon_delivery_teamId_idx" ON "balloon_delivery"("teamId");

-- CreateIndex
CREATE INDEX "balloon_delivery_questionId_idx" ON "balloon_delivery"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "balloon_delivery_teamId_questionId_key" ON "balloon_delivery"("teamId", "questionId");

-- CreateIndex
CREATE INDEX "task_history_contestId_createdAt_idx" ON "task_history"("contestId", "createdAt");

-- AddForeignKey
ALTER TABLE "balloon_delivery" ADD CONSTRAINT "balloon_delivery_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balloon_delivery" ADD CONSTRAINT "balloon_delivery_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balloon_delivery" ADD CONSTRAINT "balloon_delivery_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_balloonDeliveryId_fkey" FOREIGN KEY ("balloonDeliveryId") REFERENCES "balloon_delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
