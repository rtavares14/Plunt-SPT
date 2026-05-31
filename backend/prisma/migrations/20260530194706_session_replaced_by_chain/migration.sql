-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "replacedById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_replacedById_key" ON "sessions"("replacedById");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
