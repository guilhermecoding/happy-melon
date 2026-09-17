-- CreateTable
CREATE TABLE "contest_chef" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hasAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contest_chef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contest_chef_competitionId_idx" ON "contest_chef"("competitionId");

-- CreateIndex
CREATE INDEX "contest_chef_userId_idx" ON "contest_chef"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "contest_chef_competitionId_userId_key" ON "contest_chef"("competitionId", "userId");

-- AddForeignKey
ALTER TABLE "contest_chef" ADD CONSTRAINT "contest_chef_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
