DO $$
BEGIN
  CREATE TYPE "CommitteeStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Committee"
  ADD COLUMN IF NOT EXISTS "status" "CommitteeStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

UPDATE "Committee"
SET
  "status" = 'PUBLISHED',
  "publishedAt" = COALESCE("publishedAt", "createdAt")
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Committee_status_isActive_sortOrder_idx"
  ON "Committee"("status", "isActive", "sortOrder");
