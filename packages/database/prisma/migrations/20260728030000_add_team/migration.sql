-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usernameTeam" TEXT NOT NULL,
    "room" TEXT,
    "machine" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_contestId_idx" ON "team"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "team_contestId_usernameTeam_key" ON "team"("contestId", "usernameTeam");

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
