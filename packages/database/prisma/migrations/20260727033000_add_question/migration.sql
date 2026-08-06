-- CreateTable
CREATE TABLE "question" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "balloonColor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_contestId_idx" ON "question"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "question_contestId_label_key" ON "question"("contestId", "label");

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
