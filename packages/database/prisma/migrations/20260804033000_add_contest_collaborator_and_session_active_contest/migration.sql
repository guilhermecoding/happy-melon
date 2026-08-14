-- AlterTable
ALTER TABLE "system-auth"."session" ADD COLUMN "activeContestId" TEXT;

-- CreateTable
CREATE TABLE "contest_collaborator" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hasAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contest_collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contest_collaborator_contestId_idx" ON "contest_collaborator"("contestId");

-- CreateIndex
CREATE INDEX "contest_collaborator_userId_idx" ON "contest_collaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "contest_collaborator_contestId_userId_key" ON "contest_collaborator"("contestId", "userId");

-- AddForeignKey
ALTER TABLE "contest_collaborator" ADD CONSTRAINT "contest_collaborator_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
