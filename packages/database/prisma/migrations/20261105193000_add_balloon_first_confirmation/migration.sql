-- AlterTable
ALTER TABLE "balloon_delivery" ADD COLUMN "confirmedAt" TIMESTAMP(3),
ADD COLUMN "isFirst" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: the earliest active confirmation of each question is first.
UPDATE "balloon_delivery"
SET "confirmedAt" = "createdAt"
WHERE "status" IN ('PENDING', 'PROCESSING', 'DELIVERED');

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "questionId"
            ORDER BY "confirmedAt" ASC, id ASC
        ) AS rn
    FROM "balloon_delivery"
    WHERE "status" IN ('PENDING', 'PROCESSING', 'DELIVERED')
      AND "confirmedAt" IS NOT NULL
)
UPDATE "balloon_delivery" AS delivery
SET "isFirst" = true
FROM ranked
WHERE delivery.id = ranked.id
  AND ranked.rn = 1;

-- CreateIndex
CREATE UNIQUE INDEX "balloon_delivery_questionId_first_key"
ON "balloon_delivery" ("questionId")
WHERE "isFirst";
