-- CreateExtension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateTable
CREATE TABLE "competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ContestStatus" NOT NULL DEFAULT 'ACTIVE',
    "venue" TEXT NOT NULL,
    "balloonLimitEnabled" BOOLEAN NOT NULL DEFAULT false,
    "balloonLimit" INTEGER,
    "deliveryTimeoutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "deliveryTimeoutMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_pkey" PRIMARY KEY ("id")
);

-- Existing contests become competitions (same id preserves QR/login codes).
INSERT INTO "competition" (
    "id",
    "name",
    "status",
    "venue",
    "balloonLimitEnabled",
    "balloonLimit",
    "deliveryTimeoutEnabled",
    "deliveryTimeoutMinutes",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "name",
    "status",
    "venue",
    "balloonLimitEnabled",
    "balloonLimit",
    "deliveryTimeoutEnabled",
    "deliveryTimeoutMinutes",
    "createdAt",
    "updatedAt"
FROM "contest";

-- Contest rows become the first round of each competition.
ALTER TABLE "contest" ADD COLUMN "competitionId" TEXT;

UPDATE "contest" SET "competitionId" = "id", "name" = 'Prova';

ALTER TABLE "contest" ALTER COLUMN "competitionId" SET NOT NULL;

ALTER TABLE "contest" ADD CONSTRAINT "contest_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Teams now belong to the competition (same id as the old contest).
ALTER TABLE "team" DROP CONSTRAINT "team_contestId_fkey";
DROP INDEX "team_contestId_idx";
DROP INDEX "team_contestId_usernameTeam_key";
ALTER TABLE "team" RENAME COLUMN "contestId" TO "competitionId";
CREATE INDEX "team_competitionId_idx" ON "team"("competitionId");
CREATE UNIQUE INDEX "team_competitionId_usernameTeam_key" ON "team"("competitionId", "usernameTeam");
ALTER TABLE "team" ADD CONSTRAINT "team_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Collaborators now belong to the competition.
ALTER TABLE "contest_collaborator" DROP CONSTRAINT "contest_collaborator_contestId_fkey";
DROP INDEX "contest_collaborator_contestId_idx";
DROP INDEX "contest_collaborator_contestId_userId_key";
ALTER TABLE "contest_collaborator" RENAME COLUMN "contestId" TO "competitionId";
CREATE INDEX "contest_collaborator_competitionId_idx" ON "contest_collaborator"("competitionId");
CREATE UNIQUE INDEX "contest_collaborator_competitionId_userId_key" ON "contest_collaborator"("competitionId", "userId");
ALTER TABLE "contest_collaborator" ADD CONSTRAINT "contest_collaborator_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Round-only columns on contest.
ALTER TABLE "contest" DROP COLUMN "status",
DROP COLUMN "venue",
DROP COLUMN "balloonLimitEnabled",
DROP COLUMN "balloonLimit",
DROP COLUMN "deliveryTimeoutEnabled",
DROP COLUMN "deliveryTimeoutMinutes";

CREATE INDEX "contest_competitionId_startsAt_idx" ON "contest"("competitionId", "startsAt");

-- Semi-open windows [startsAt, endsAt): adjacent rounds are allowed, overlap is not.
ALTER TABLE "contest" ADD CONSTRAINT "contest_no_overlap_per_competition"
    EXCLUDE USING gist (
        "competitionId" WITH =,
        tsrange("startsAt", "endsAt", '[)') WITH &&
    );
