-- CreateTable
CREATE TABLE "balloon_color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balloon_color_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "balloon_color_nameKey_key" ON "balloon_color"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "balloon_color_hex_key" ON "balloon_color"("hex");
